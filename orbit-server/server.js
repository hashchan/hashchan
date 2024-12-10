import "dotenv/config"
import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'

import { yamux  } from '@chainsafe/libp2p-yamux'
import { noise  } from '@chainsafe/libp2p-noise'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { webSockets } from '@libp2p/websockets'
import { createOrbitDB, IPFSAccessController  } from '@orbitdb/core'
import { identify } from "@libp2p/identify";

import * as filters from "@libp2p/websockets/filters";

const main = async () => {
  const blockstore = new LevelBlockstore("./hashchan/blockstore")
  const datastore = new LevelDatastore("./hashchan/datastore")

  await datastore.open()
  await blockstore.open()
  const libp2p = await createLibp2p({
    datastore,
    addresses: {
      listen: [`/ip4/${process.env.IP}/tcp/${process.env.PORT}/ws`],
    },
    transports: [ webSockets({
      filter: filters.all
    })],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true
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
