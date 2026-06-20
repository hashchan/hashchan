import "dotenv/config"
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'

import { yamux  } from '@chainsafe/libp2p-yamux'
import { noise  } from '@chainsafe/libp2p-noise'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { webSockets } from '@libp2p/websockets'
import { createOrbitDB, IPFSAccessController, useIdentityProvider  } from '@orbitdb/core'
import { identify, identifyPush } from "@libp2p/identify";
import { circuitRelayServer  } from '@libp2p/circuit-relay-v2'

//import * as filters from "@libp2p/websockets/filters";
import { loadOrCreatePeerId } from  "./src/loadOrCreatePeerId.js"

import { publicClients, instances } from './src/config.js'

import { affirmJanny } from './src/affirmJanny.js'

import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import { Wallet } from '@ethersproject/wallet'

const main = async () => {

  const ethersWallet = new Wallet(process.env.OWNER_KEY)
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const provider = OrbitDBIdentityProviderEthereum.default({ wallet: ethersWallet })

  const peerId = await loadOrCreatePeerId()

  const blockstore = new LevelBlockstore("./hashchan/blockstore")
  const datastore = new LevelDatastore("./hashchan/datastore")

  await datastore.open()
  await blockstore.open()
  
  const libp2p = await createLibp2p({
    peerId,
    datastore,
    addresses: {
      listen: [
        //`/ip4/127.0.0.1/tcp/${process.env.PORT}/ws`,
        `/ip4/0.0.0.0/tcp/${process.env.PORT}/ws`,
        `/ip4/0.0.0.0/tcp/4002/`
      ],
      announce: [
        `/dns4/orbit.hashchan.org/tcp/443/wss`,
        `/ip4/${process.env.IP}/tcp/4002`
      ]
    },
    transports: [
      webSockets({
        //filter: filters.all
      }),
      //tcp()
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        emitSelf: false,
      }),
      relay: circuitRelayServer({
        reservations: {
          maxReservations: Infinity
        }
      }),
      identify: identify(),
      identifyPush: identifyPush()
    }
  })
  const helia = await createHelia({
    datastore,
    blockstore,
    libp2p
  })
  const orbit = await createOrbitDB({
    ipfs:helia,
    directory: './hashchan/orbitdb',
    identity: { provider }
  })

  const db = await orbit.open(
    'hashchan',
    { type: 'keyvalue',
      AccessController: IPFSAccessController({ write: [orbit.identity.id] })}
  )
  console.log('db addr', db.address.toString())

  console.log('serverlistening on: ')
  helia.libp2p.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })


  for (const instance in instances) {
    const baseUrl = `/chainId/${(await publicClients[instance].getChainId())}/address/${instances[instance].address}`
    console.log('subscribing to topic:', baseUrl)
    helia.libp2p.services.pubsub.subscribe(baseUrl)
  }

  // Join handshake: browser sends { chainId, address }, server responds with { orbitDbAddr }
  helia.libp2p.handle('/hashchan/join/1.0.0', async ({ stream }) => {
    try {
      const chunks = []
      for await (const chunk of stream.source) {
        chunks.push(chunk.subarray ? chunk.subarray() : chunk)
      }
      const total = chunks.reduce((n, c) => n + c.length, 0)
      const buf = new Uint8Array(total)
      let off = 0
      for (const chunk of chunks) { buf.set(chunk, off); off += chunk.length }

      const { chainId, address } = JSON.parse(new TextDecoder().decode(buf))
      if (!instances[chainId] || instances[chainId].address.toLowerCase() !== address.toLowerCase()) {
        await stream.sink([new TextEncoder().encode(JSON.stringify({ error: 'unknown moderation service' }))])
        return
      }

      console.log(`join: chainId=${chainId} address=${address}`)
      await stream.sink([new TextEncoder().encode(JSON.stringify({ orbitDbAddr: db.address.toString() }))])
    } catch (e) {
      console.error('join handler error:', e)
    } finally {
      try { await stream.close() } catch {}
    }
  })

  // Moderation action submissions from browser nodes via gossipsub
  helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
    const { topic, data } = event.detail
    console.log('message received:', topic)
    const [, , chainId, , address] = topic.split('/')
    const json = JSON.parse(new TextDecoder().decode(data))
    const valid = await publicClients[chainId].verifyTypedData(json)
    if (valid) {
      const { affirmData, affirmSig } = await affirmJanny({
        janitor: json.address,
        postId: json.message.postId,
        signature: json.signature,
        chainId: chainId
      })
      const record = {
        janny: json,
        affirmation: { data: affirmData, signature: affirmSig }
      }
      await db.put(json.message.postId, record)
      helia.libp2p.services.pubsub.publish(
        topic,
        new TextEncoder().encode(JSON.stringify({ success: true, record }))
      )
    } else {
      helia.libp2p.services.pubsub.publish(
        topic,
        new TextEncoder().encode(JSON.stringify({ success: false }))
      )
    }
  })

  helia.libp2p.addEventListener('peer:connect', (event) => {
    console.log('peer:connect', event.detail.toString())
  })

  db.events.on('peer:join', (peerId) => {
    console.log("peer:join", peerId)
  })

  db.events.on('update', (entry) => {
    console.log("update", entry)
  })

  db.events.on('join', (peerId, heads) => {
    console.log("join", peerId, heads)
  })

  process.on('SIGINT', async () => {
    await db.close()
    await orbit.stop()
    await helia.stop()
    await libp2p.stop()
    process.exit()
  })


}

main()
