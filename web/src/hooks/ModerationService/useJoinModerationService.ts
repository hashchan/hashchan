import {
  useEffect,
  useState,
  useCallback,
  useContext,
  useRef
} from 'react'

import {
  useAccount
} from 'wagmi'

import {
  HeliaContext
} from '@/provider/HeliaProvider'

import {
  IDBContext
} from '@/provider/IDBProvider'

import {
  ModerationServicesContext
} from '@/provider/ModerationServicesProvider'

import { multiaddr } from '@multiformats/multiaddr'

const PING_RETRY_INTERVAL = 2000
const PING_MAX_RETRIES = 15

export const useJoinModerationService = (ms: any) => {
  const { helia, startOrbitDb } = useContext(HeliaContext)
  const { chain } = useAccount()
  const { addPubsubHandle } = useContext(ModerationServicesContext)
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dial, setDial] = useState(null)
  const [dialErrors, setDialErrors] = useState([])
  const messageHandlerRef = useRef<((event: any) => void) | null>(null)

  const joinModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id) return

    try {
      const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
      let pingResolved = false

      if (messageHandlerRef.current) {
        helia.libp2p.services.pubsub.removeEventListener("message", messageHandlerRef.current)
      }

      const handler = async (event) => {
        const { topic, data } = event.detail
        if (topic !== `${baseUrl}/ping`) return

        pingResolved = true
        helia.libp2p.services.pubsub.removeEventListener("message", handler)
        messageHandlerRef.current = null

        const json = JSON.parse(new TextDecoder().decode(data))
        const exists = await db.moderationServices.where({
          chainId: Number(chain.id),
          address: ms.address
        }).count() > 0

        if (exists) {
          await db.moderationServices.where({
            chainId: Number(chain.id),
            address: ms.address
          }).modify({ subscribed: 1 })
        } else {
          await db.moderationServices.add({
            subscribed: 1,
            uri: ms.uri,
            name: ms.name,
            port: ms.port,
            address: ms.address,
            chainId: Number(chain.id),
            owner: ms.owner,
            orbitDbAddr: json.orbitDbAddr
          })
        }
        await startOrbitDb()
        setJoined(true)
      }

      messageHandlerRef.current = handler
      helia.libp2p.services.pubsub.addEventListener("message", handler)

      // Subscribe before dialing so the server sees our subscriptions on connect
      await helia.libp2p.services.pubsub.subscribe(baseUrl)
      await helia.libp2p.services.pubsub.subscribe(`${baseUrl}/ping`)

      const ma = multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`)
      console.log('ma', ma)
      const connection = await helia.libp2p.dial(ma)
      console.log('dial', connection)
      setDial(connection)

      // Poll for mesh formation then retry ping until we get a response
      let retries = 0
      const doPing = async () => {
        if (pingResolved) return
        if (retries >= PING_MAX_RETRIES) {
          setDialErrors(old => [...old, 'Max retries reached, no ping response from moderation service'])
          return
        }
        retries++

        const subscribers = helia.libp2p.services.pubsub.getSubscribers(`${baseUrl}/ping`)
        const pubsubPeers = helia.libp2p.services.pubsub.getPeers()
        const connections = helia.libp2p.getConnections()
        if (subscribers.length === 0) {
          console.log(`Waiting for peer mesh (attempt ${retries}/${PING_MAX_RETRIES}) | pubsub peers: ${pubsubPeers.length} | connections: ${connections.length}`)
          setTimeout(doPing, PING_RETRY_INTERVAL)
          return
        }

        console.log(`Publishing ping (attempt ${retries}/${PING_MAX_RETRIES})`)
        const result = await helia.libp2p.services.pubsub.publish(`${baseUrl}/ping`, new Uint8Array(0))
        console.log('ping', result)
        if (!pingResolved) {
          setTimeout(doPing, PING_RETRY_INTERVAL)
        }
      }

      await doPing()

    } catch (e) {
      console.log(e)
      setDialErrors(old => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id, startOrbitDb])

  const leaveModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id) return
    try {
      if (messageHandlerRef.current) {
        helia.libp2p.services.pubsub.removeEventListener("message", messageHandlerRef.current)
        messageHandlerRef.current = null
      }
      setJoined(false)
      setDial(null)
      const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
      helia.libp2p.services.pubsub.unsubscribe(baseUrl)
      helia.libp2p.services.pubsub.unsubscribe(`${baseUrl}/ping`)
      try {
        await db.moderationServices
          .where('[address+chainId]')
          .equals([ms.address, Number(chain.id)])
          .modify({ subscribed: 0 })
      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    } catch (e) {
      console.log(e)
      setDialErrors(old => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id])

  useEffect(() => {
    if (db) {
      const getJoined = async () => {
        const modService = await db.moderationServices
          .where('[address+chainId]')
          .equals([ms.address, Number(chain.id)])
          .first()
        if (!modService) return
        setJoined(modService.subscribed === 1)
      }
      getJoined()
    }
  }, [db, chain?.id, ms.address])

  return {
    joined,
    joinModerationService,
    leaveModerationService,
    dial,
    dialErrors
  }
}
