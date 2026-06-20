import {
  useEffect,
  useState,
  useCallback,
  useContext
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

const JOIN_PROTOCOL = '/hashchan/join/1.0.0'

async function collectStream(source: AsyncIterable<any>): Promise<Uint8Array> {
  const chunks: Uint8Array[] = []
  for await (const chunk of source) {
    chunks.push(chunk.subarray ? chunk.subarray() : chunk)
  }
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const buf = new Uint8Array(total)
  let off = 0
  for (const chunk of chunks) { buf.set(chunk, off); off += chunk.length }
  return buf
}

export const useJoinModerationService = (ms: any) => {
  const { helia, startOrbitDb } = useContext(HeliaContext)
  const { chain } = useAccount()
  const { addPubsubHandle } = useContext(ModerationServicesContext)
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dialErrors, setDialErrors] = useState([])

  const joinModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id) return

    try {
      const ma = multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`)
      console.log('dialing', ma.toString())

      // Open a direct protocol stream — no gossipsub mesh needed
      const stream = await helia.libp2p.dialProtocol(ma, JOIN_PROTOCOL)

      // Send join request
      const request = new TextEncoder().encode(
        JSON.stringify({ chainId: chain.id, address: ms.address })
      )
      await stream.sink([request])

      // Read response
      const buf = await collectStream(stream.source)
      const { orbitDbAddr, error } = JSON.parse(new TextDecoder().decode(buf))

      if (error) {
        setDialErrors(old => [...old, error])
        return
      }

      console.log('join success, orbitDbAddr:', orbitDbAddr)

      const exists = await db.moderationServices.where({
        chainId: Number(chain.id),
        address: ms.address
      }).count() > 0

      if (exists) {
        await db.moderationServices.where({
          chainId: Number(chain.id),
          address: ms.address
        }).modify({ subscribed: 1, orbitDbAddr })
      } else {
        await db.moderationServices.add({
          subscribed: 1,
          uri: ms.uri,
          name: ms.name,
          port: ms.port,
          address: ms.address,
          chainId: Number(chain.id),
          owner: ms.owner,
          orbitDbAddr
        })
      }

      // Subscribe to gossipsub topic for moderation action submissions
      const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
      await helia.libp2p.services.pubsub.subscribe(baseUrl)

      await startOrbitDb()
      setJoined(true)

    } catch (e) {
      console.error(e)
      setDialErrors(old => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id, startOrbitDb])

  const leaveModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id) return
    try {
      const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
      helia.libp2p.services.pubsub.unsubscribe(baseUrl)
      setJoined(false)
      await db.moderationServices
        .where('[address+chainId]')
        .equals([ms.address, Number(chain.id)])
        .modify({ subscribed: 0 })
    } catch (e) {
      console.error(e)
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
    dialErrors
  }
}
