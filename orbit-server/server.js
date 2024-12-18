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
import { createOrbitDB, IPFSAccessController, useIdentityProvider  } from '@orbitdb/core'
import { identify } from "@libp2p/identify";
import { circuitRelayServer  } from '@libp2p/circuit-relay-v2'

import * as filters from "@libp2p/websockets/filters";
import { loadOrCreatePeerId } from  "./src/loadOrCreatePeerId.js"

import { account, publicClient, modServiceInstance } from './src/config.js'

import { affirmJanny } from './src/affirmJanny.js'

import  ModerationService from './src/abi/ModerationService.json' with {type: "json"}

import * as OrbitDBIdentityProviderEthereum from '@orbitdb/identity-provider-ethereum'
import { Wallet } from '@ethersproject/wallet'


const addr = ModerationService[11155111].address

const main = async () => {
  const ethersWallet = new Wallet(process.env.OWNER_KEY)
  console.log(OrbitDBIdentityProviderEthereum)
  useIdentityProvider(OrbitDBIdentityProviderEthereum.default)
  const provider = OrbitDBIdentityProviderEthereum.default({ wallet: ethersWallet })

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
  const chainId = Number(await publicClient.getChainId())
  const baseUrl = `/chainId/${chainId}/address/${addr}`
  console.log('baseUrl', baseUrl)
  helia.libp2p.services.pubsub.subscribe(baseUrl)

  helia.libp2p.services.pubsub.subscribe(`${baseUrl}/ping`)

  helia.libp2p.services.pubsub.addEventListener('message', async (event) => {
    console.log('message', event)
    const { topic, data } = event.detail
    console.log('topic', topic)
    switch (topic) {
      case (baseUrl):
        console.log('data', new TextDecoder().decode(data))
        const json = JSON.parse(new TextDecoder().decode(data))
        const valid = await publicClient.verifyTypedData(json)
        console.log('valid', valid)
        if (valid) {
          console.log('json', json)
          const {affirmData, affirmSig} = await affirmJanny({
            janitor: json.address,
            postId: json.message.postId,
            signature: json.signature
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
            baseUrl, 
            new TextEncoder().encode(
              JSON.stringify({
                success: true,
                record,
              })
            ))
        } else {
          helia.libp2p.services.pubsub.publish(
            baseUrl,
            new TextEncoder().encode(
              JSON.stringify({success: false})
            )
          )
        }
        break;
      case (`${baseUrl}/ping`):
        console.log(db.address.toString())
        helia.libp2p.services.pubsub.publish(
          `${baseUrl}/ping`,
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
