import "dotenv/config"
import { LevelDatastore } from 'datastore-level'
import { yamux } from '@chainsafe/libp2p-yamux'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { identify, identifyPush } from "@libp2p/identify"
import { lpStream } from '@libp2p/utils'
import { circuitRelayServer } from '@libp2p/circuit-relay-v2'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'

import { loadOrCreatePeerId } from "./src/loadOrCreatePeerId.js"
import { publicClients, instances } from './src/config.js'
import { affirmJanny } from './src/affirmJanny.js'

const QUERY_PROTOCOL = '/hashchan/query/1.0.0'
const QUERY_BATCH_PROTOCOL = '/hashchan/query-batch/1.0.0'
const JANNY_PROTOCOL = '/hashchan/janny/1.0.0'

const DB_DIR = './hashchan'
const DB_PATH = `${DB_DIR}/moderation.json`

const loadRecords = async () => {
  if (!existsSync(DB_PATH)) return {}
  const raw = await readFile(DB_PATH, 'utf8')
  return JSON.parse(raw)
}

const saveRecords = async (records) => {
  await mkdir(DB_DIR, { recursive: true })
  await writeFile(DB_PATH, JSON.stringify(records))
}

const main = async () => {
  const moderationRecords = await loadRecords()
  console.log(`[db] loaded ${Object.keys(moderationRecords).length} moderation records`)

  const peerId = await loadOrCreatePeerId()
  const datastore = new LevelDatastore('./hashchan/datastore')
  await datastore.open()

  const libp2p = await createLibp2p({
    peerId,
    datastore,
    addresses: {
      listen: [
        `/ip4/0.0.0.0/tcp/${process.env.PORT}/ws`,
        `/ip4/0.0.0.0/tcp/4002/`
      ],
      announce: [
        `/dns4/orbit.hashchan.org/tcp/443/wss`,
        `/ip4/${process.env.IP}/tcp/4002`
      ]
    },
    transports: [webSockets()],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      pubsub: gossipsub({ allowPublishToZeroTopicPeers: true, emitSelf: false }),
      relay: circuitRelayServer({ reservations: { maxReservations: Infinity } }),
      identify: identify(),
      identifyPush: identifyPush()
    }
  })

  await libp2p.start()

  console.log('server listening on:')
  libp2p.getMultiaddrs().forEach(addr => console.log(addr.toString()))

  for (const instance in instances) {
    try {
      const chainId = await publicClients[instance].getChainId()
      const baseUrl = `/chainId/${chainId}/address/${instances[instance].address}`
      console.log('subscribing to topic:', baseUrl)
      libp2p.services.pubsub.subscribe(baseUrl)
    } catch (e) {
      console.error(`[init] failed to subscribe to chain ${instance}:`, e.message)
    }
  }

  // Query single: client sends { postId }, server responds with record or null
  await libp2p.handle(QUERY_PROTOCOL, async (stream) => {
    try {
      const lp = lpStream(stream)
      const msg = await lp.read()
      const { postId } = JSON.parse(new TextDecoder().decode(msg.subarray()))
      const record = moderationRecords[postId] ?? null
      await lp.write(new TextEncoder().encode(JSON.stringify({ record })))
    } catch (e) {
      console.error('[query] handler error:', e)
    }
  })

  // Query batch: client sends { postIds: string[] }, server responds with { records: Record<string, any> }
  await libp2p.handle(QUERY_BATCH_PROTOCOL, async (stream) => {
    try {
      const lp = lpStream(stream)
      const msg = await lp.read()
      const { postIds } = JSON.parse(new TextDecoder().decode(msg.subarray()))
      const records: Record<string, any> = {}
      for (const postId of postIds) {
        if (moderationRecords[postId]) records[postId] = moderationRecords[postId]
      }
      await lp.write(new TextEncoder().encode(JSON.stringify({ records })))
    } catch (e) {
      console.error('[query-batch] handler error:', e)
    }
  })

  // Janny: browser sends signed moderation action, server verifies and persists
  await libp2p.handle(JANNY_PROTOCOL, async (stream, connection) => {
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

      const postId = typedDataPayload.message.postId
      moderationRecords[postId] = record
      await saveRecords(moderationRecords)

      console.log('[janny] stored record for', postId)
      await lp.write(new TextEncoder().encode(JSON.stringify({ success: true, record })))
    } catch (e) {
      console.error('[janny] handler error:', e)
    }
  })

  libp2p.addEventListener('peer:connect', event => {
    console.log('peer:connect', event.detail.toString())
  })

  process.on('SIGINT', async () => {
    await libp2p.stop()
    await datastore.close()
    process.exit()
  })
}

main().catch(err => {
  console.error('[startup] fatal error:', err)
  process.exit(1)
})
