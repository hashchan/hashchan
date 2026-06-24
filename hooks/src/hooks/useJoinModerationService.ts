import { useState, useCallback, useEffect, useContext } from 'react'
import { useConnection } from 'wagmi'
import { multiaddr } from '@multiformats/multiaddr'

import { IDBContext } from '../provider/IDBProvider'
import type { ModerationService } from '../provider/IDBProvider'

// helia is passed in rather than imported — the hooks package has no helia/libp2p bundle dep.
export const useJoinModerationService = (
  ms: ModerationService | null | undefined,
  helia: any,
  addPubsubHandle: (() => Promise<void>) | undefined
) => {
  const { chain } = useConnection()
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dialErrors, setDialErrors] = useState<string[]>([])

  useEffect(() => {
    if (!db || !ms || !chain?.id) return
    db.moderationServices
      .where('[address+chainId]')
      .equals([ms.address, Number(chain.id)])
      .first()
      .then((record) => { if (record) setJoined(record.subscribed === 1) })
  }, [db, chain?.id, ms?.address])

  const joinModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id || !addPubsubHandle) return

    try {
      await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))

      const exists =
        (await db.moderationServices
          .where({ chainId: Number(chain.id), address: ms.address })
          .count()) > 0

      if (exists) {
        await db.moderationServices
          .where({ chainId: Number(chain.id), address: ms.address })
          .modify({ subscribed: 1 })
      } else {
        await db.moderationServices.add({
          subscribed: 1,
          uri: ms.uri,
          name: ms.name,
          port: ms.port,
          address: ms.address,
          chainId: Number(chain.id),
          owner: ms.owner,
          orbitDbAddr: '',
        })
      }

      await helia.libp2p.services.pubsub.subscribe(`/chainId/${chain.id}/address/${ms.address}`)
      await addPubsubHandle()
      setJoined(true)
    } catch (e: any) {
      console.error(e)
      setDialErrors((old) => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id, addPubsubHandle])

  const leaveModerationService = useCallback(async () => {
    if (!helia || !db || !ms || !chain?.id) return
    try {
      helia.libp2p.services.pubsub.unsubscribe(`/chainId/${chain.id}/address/${ms.address}`)
      await db.moderationServices
        .where('[address+chainId]')
        .equals([ms.address, Number(chain.id)])
        .modify({ subscribed: 0 })
      setJoined(false)
    } catch (e: any) {
      console.error(e)
      setDialErrors((old) => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id])

  return { joined, joinModerationService, leaveModerationService, dialErrors }
}
