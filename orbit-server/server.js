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
import { lpStream } from '@libp2p/utils'
import { circuitRelayServer  } from '@libp2p/circuit-relay-v2'
import { CID } from 'multiformats/cid'

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
    try {
      const baseUrl = `/chainId/${(await publicClients[instance].getChainId())}/address/${instances[instance].address}`
      console.log('subscribing to topic:', baseUrl)
      helia.libp2p.services.pubsub.subscribe(baseUrl)
    } catch (e) {
      console.error(`[init] failed to subscribe to chain ${instance}:`, e.message)
    }
  }

  // Janny protocol: browser sends signed moderation action, server verifies and stores
  await helia.libp2p.handle('/hashchan/janny/1.0.0', async (stream, connection) => {
    try {
      const lp = lpStream(stream)
      const msg = await lp.read()
      const json = JSON.parse(new TextDecoder().decode(msg.subarray()))
      console.log('[janny] received from', connection.remotePeer.toString())

      const { topic, ...typedDataPayload } = json
      const [, , chainId] = topic.split('/')

      const valid = await publicClients[chainId].verifyTypedData(typedDataPayload)
      if (!valid) {
        await lp.write(new TextEncoder().encode(JSON.stringify({ success: false, error: 'invalid signature' })))
        return
      }

      const { affirmData, affirmSig } = await affirmJanny({
        janitor: typedDataPayload.address,
        postId: typedDataPayload.message.postId,
        signature: typedDataPayload.signature,
        chainId
      })

      const record = {
        janny: typedDataPayload,
        affirmation: { data: affirmData, signature: affirmSig }
      }

      await db.put(typedDataPayload.message.postId, record)
      console.log('[janny] stored record for', typedDataPayload.message.postId)
      await lp.write(new TextEncoder().encode(JSON.stringify({ success: true, record })))
    } catch (e) {
      console.error('[janny] handler error:', e)
    }
  })

  // OrbitDB handshake: server pushes orbitDbAddr + raw manifest block, client confirms ready
  await helia.libp2p.handle('/hashchan/orbitdb/1.0.0', async (stream, connection) => {
    try {
      const lp = lpStream(stream)
      const orbitDbAddr = db.address.toString()

      // Read the manifest block from the local blockstore so the client can
      // seed its own blockstore without needing bitswap for the manifest CID.
      // Helper: read a single block from the LevelBlockstore by CID string
      const readBlock = async (cidStr) => {
        try {
          const cid = CID.parse(cidStr)
          for await (const chunk of blockstore.get(cid)) {
            return Array.from(chunk)
          }
        } catch (e) {
          console.error(`[orbitdb] could not read block ${cidStr}:`, e.message)
        }
        return null
      }

      // db.address is a plain string '/orbitdb/<hash>'
      const manifestBlock = await readBlock(orbitDbAddr.replace('/orbitdb/', ''))
      console.log('[orbitdb] manifest block bytes:', manifestBlock?.length)

      // IPFSAccessController also stores its config in IPFS as a separate block
      const acHash = db.access?.address?.replace('/ipfs/', '')
      const accessControllerBlock = acHash ? await readBlock(acHash) : null
      console.log('[orbitdb] access controller block bytes:', accessControllerBlock?.length)

      await lp.write(new TextEncoder().encode(JSON.stringify({
        orbitDbAddr,
        manifestBlock,
        accessControllerBlock,
        accessControllerCid: acHash ?? null
      })))
      const msg = await lp.read()
      const { ready } = JSON.parse(new TextDecoder().decode(msg.subarray()))
      if (ready) {
        console.log('peer ready:', connection.remotePeer.toString())
      }
    } catch (e) {
      console.error('orbitdb handler error:', e)
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

main().catch(err => {
  console.error('[startup] fatal error:', err)
  process.exit(1)
})
