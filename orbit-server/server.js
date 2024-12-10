import { LevelBlockstore } from 'blockstore-level'
import { LevelDatastore } from 'datastore-level'

import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createLibp2p } from 'libp2p'
import { createHelia } from 'helia'
import { tcp } from '@libp2p/tcp'
import { createOrbitDB, IPFSAccessController  } from '@orbitdb/core'
import { identify } from "@libp2p/identify";
const main = async () => {
  const blockstore = new LevelBlockstore("./hashchan/blockstore")
  const datastore = new LevelDatastore("./hashchan/datastore")

  await datastore.open()
  await blockstore.open()
  const libp2p = await createLibp2p({
    datastore,
    addresses: {
      listen: ['/ip4/192.53.120.61/tcp/81']
    },
    transports: [tcp()],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true
      }),
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

  process.on('SIGINT', async () => {
    await db.close()
    await orbit.stop()
    await helia.stop()
    await libp2p.stop()
    process.exit()
  })


}

main()
