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

import { publicClient } from './src/config.js'


const main = async () => {
  const peerId = await loadOrCreatePeerId()
	//console.log(peerId.toJSON())	

  const blockstore = new LevelBlockstore("./hashchan/blockstore")
  const datastore = new LevelDatastore("./hashchan/datastore")

  await datastore.open()
  await blockstore.open()
  console.log('peerId', peerId)
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
        emitSelf: true,
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
    { AccessController: IPFSAccessController({ write: ['*'] })}
  )

  console.log('serverlistening on: ')
  helia.libp2p.getMultiaddrs().forEach((addr) => {
    console.log(addr.toString())
  })

  helia.libp2p.services.pubsub.subscribe('hashchan')

  helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
    console.log('message', event)
    let { topic, data } = event.detail
    console.log('topic', topic)
    data = JSON.parse(new TextDecoder().decode(data))
    console.log('data', data)
    const valid = await publicClient.verifyTypedData(data)
    console.log('valid', valid)

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
    console.log("join", entry)
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
