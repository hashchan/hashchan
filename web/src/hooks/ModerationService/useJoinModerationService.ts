import {
  useEffect,
  useState,
  useCallback,
  useContext
} from 'react'

import { useAccount } from 'wagmi'
import { HeliaContext } from '@/provider/HeliaProvider'
import { IDBContext } from '@/provider/IDBProvider'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'
import { multiaddr } from '@multiformats/multiaddr'

export const useJoinModerationService = (ms: any) => {
  const { helia } = useContext(HeliaContext)
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
      await helia.libp2p.dial(ma)

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
          orbitDbAddr: ''
        })
      }

      const baseUrl = `/chainId/${chain.id}/address/${ms.address}`
      await helia.libp2p.services.pubsub.subscribe(baseUrl)

      await addPubsubHandle()
      setJoined(true)
    } catch (e) {
      console.error(e)
      setDialErrors(old => [...old, e.message])
    }
  }, [helia, db, ms, chain?.id, addPubsubHandle])

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
