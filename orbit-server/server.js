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
    const baseUrl =`/chainId/${(await publicClients[instance].getChainId())}/address/${instances[instance].address}`
    console.log('subscribing to topics:', baseUrl, `${baseUrl}/ping`)
    helia.libp2p.services.pubsub.subscribe(baseUrl)
    helia.libp2p.services.pubsub.subscribe(`${baseUrl}/ping`)
  }

  console.log('pubsub topics after subscribe:', helia.libp2p.services.pubsub.getTopics())

  helia.libp2p.services.pubsub.addEventListener('subscription-change', (event) => {
    const { peerId, subscriptions } = event.detail
    console.log('subscription-change from peer:', peerId.toString())
    console.log('subscriptions:', subscriptions.map(s => `${s.topic} (${s.subscribe ? 'sub' : 'unsub'})`))
    for (const topic of helia.libp2p.services.pubsub.getTopics()) {
      console.log(`  getSubscribers(${topic}):`, helia.libp2p.services.pubsub.getSubscribers(topic).map(p => p.toString()))
    }
  })

  helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
    const { topic, data } = event.detail
    console.log('message received!', topic, data)
    const [, , chainId, , address , action] = topic.split('/')
    switch (action) {
      case (undefined):
        const json = JSON.parse(new TextDecoder().decode(data))
        const valid = await publicClients[chainId].verifyTypedData(json)
        if (valid) {
          const {affirmData, affirmSig} = await affirmJanny({
            janitor: json.address,
            postId: json.message.postId,
            signature: json.signature,
            chainId: chainId
          })

          const record = {
            janny: json,
            affirmation: {
              data: affirmData,
              signature: affirmSig
            }
          }

          await db.put(json.message.postId, record)
          helia.libp2p.services.pubsub.publish(
            topic, 
            new TextEncoder().encode(
              JSON.stringify({
                success: true,
                record,
              })
            ))
        } else {
          helia.libp2p.services.pubsub.publish(
            topic,
            new TextEncoder().encode(
              JSON.stringify({success: false})
            )
          )
        }
        break;
      case (`ping`):
        console.log(db.address.toString())
        helia.libp2p.services.pubsub.publish(
          topic,
          new TextEncoder().encode(JSON.stringify({
            orbitDbAddr: db.address.toString()
          }))
        )
        break;
      default:
        console.log('topic', topic)
        console.log('data', data)


    }

  })

  helia.libp2p.addEventListener('peer:discovery', (event) => {
    console.log("peer:discovery", event)
  })

  helia.libp2p.addEventListener('peer:connect', (event) => {
    console.log("peer:connect", event.detail.toString())
    console.log('pubsub peers after connect:', helia.libp2p.services.pubsub.getPeers().map(p => p.toString()))
    for (const topic of helia.libp2p.services.pubsub.getTopics()) {
      console.log(`  getSubscribers(${topic}):`, helia.libp2p.services.pubsub.getSubscribers(topic).map(p => p.toString()))
    }
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
