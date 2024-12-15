import "dotenv/config"
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'

import { yamux  } from '@chainsafe/libp2p-yamux'
import { noise  } from '@chainsafe/libp2p-noise'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { webSockets } from '@libp2p/websockets'
import { tcp } from '@libp2p/tcp'
import { createOrbitDB, IPFSAccessController  } from '@orbitdb/core'
import { identify } from "@libp2p/identify";
import { circuitRelayServer  } from '@libp2p/circuit-relay-v2'

import * as filters from "@libp2p/websockets/filters";
import { loadOrCreatePeerId } from  "./src/loadOrCreatePeerId.js"

import { publicClient, modServiceInstance } from './src/config.js'

const addr = process.env.MOD_SERVICE_ADDRESS

const main = async () => {
  const peerId = await loadOrCreatePeerId()
  //console.log(peerId.toJSON())	

  const blockstore = new LevelBlockstore("./hashchan/blockstore")
  const datastore = new LevelDatastore("./hashchan/datastore")

  await datastore.open()
  await blockstore.open()
  //console.log('peerId', peerId)
  const libp2p = await createLibp2p({
    peerId,
    datastore,
    addresses: {
      listen: [
        `/ip4/127.0.0.1/tcp/${process.env.PORT}/ws`,
        `/ip4/0.0.0.0/tcp/4002/`
      ],
      announce: [
        `/dns4/orbit.hashchan.org/tcp/443/wss`,
        `/ip4/${process.env.IP}/tcp/4002`
      ]
    },
    transports: [
      webSockets({
        filter: filters.all
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
      relay: circuitRelayServer(),
      identify: identify()
    }
  })
  const helia = await createHelia({
    datastore,
    blockstore,
    libp2p
  })
  const orbit = await createOrbitDB({
    ipfs:helia,
    directory: './hashchan/orbitdb'
  })

  const db = await orbit.open(
    'hashchan',
    { type: 'keyvalue',
      AccessController: IPFSAccessController({ write: ['*'] })}
  )
  console.log('db addr', db.address.toString())

  console.log('serverlistening on: ')
  helia.libp2p.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })

  helia.libp2p.services.pubsub.subscribe(addr)
  helia.libp2p.services.pubsub.subscribe(`${addr}/ping`)

  helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
    console.log('message', event)
    const { topic, data } = event.detail
    console.log('topic', topic)
    switch (topic) {
      case (addr):
        console.log('data', new TextDecoder().decode(data))
        const json = JSON.parse(new TextDecoder().decode(data))
        const valid = await publicClient.verifyTypedData(json)
        console.log('valid', valid)
        if (valid) {
          await db.put(json.message.postId, json)
          helia.libp2p.services.pubsub.publish(process.env.MOD_SERVICE_ADDRESS, 
            new TextEncoder().encode(
              JSON.stringify({success: true, typedData: json})
            ))
        } else {
          helia.libp2p.services.pubsub.publish(process.env.MOD_SERVICE_ADDRESS,
            new TextEncoder().encode(
              JSON.stringify({success: false})
            )
          )
        }
        break;
      case (`${addr}/ping`):
        console.log(db.address.toString())
        helia.libp2p.services.pubsub.publish(
          `${addr}/ping`,
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
    console.log("peer:connect", event)
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
