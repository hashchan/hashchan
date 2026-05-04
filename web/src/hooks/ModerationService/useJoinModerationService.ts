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

import { lpStream } from '@libp2p/utils'
import { multiaddr  } from '@multiformats/multiaddr'

export const useJoinModerationService = (ms: any) => {
  const { helia, startOrbitDb } = useContext(HeliaContext)
  const { chain } = useAccount()
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dial, setDial] = useState(null)
  const [dialErrors, setDialErrors] = useState([])

  const joinModerationService = useCallback(async () => {
    console.log(Boolean(helia), Boolean(db), Boolean(ms), Boolean(chain?.id))
    if ( helia && db && ms && chain?.id ) {  
      try {
        const ma = multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`)
        const dial = await helia.libp2p.dial(ma)
        const stream = await helia.libp2p.dialProtocol(
          dial.remotePeer,
          '/hashchan/orbitdb/1.0.0'
        )

        const lp = lpStream(stream)
        const msg = await lp.read()
        const { orbitDbAddr } = JSON.parse(new TextDecoder().decode(msg.subarray()))
        await lp.write(new TextEncoder().encode(JSON.stringify({ ready: true })))
        console.log('orbitDbAddr', orbitDbAddr)

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
        await startOrbitDb()
        setJoined(true)
        setDial(dial)


      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms, chain?.id, startOrbitDb])

  const leaveModerationService = useCallback(async () => {
    if ( helia && db && ms && chain?.id ) {  
      try {
        setJoined(false)
        setDial(null)
        helia.libp2p.services.pubsub.unsubscribe(ms.address)
        try {
          await db.moderationServices
          .where('[address+chainId]')
          .equals([ms.address,Number(chain.id)]).modify({subscribed: 0})
        } catch (e) {
          console.log(e)
          setDialErrors(old => [...old, e.message])
        }
      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms, chain?.id])

  useEffect(() => {
    if (db) {
      const getJoined = async () => {
        const modService = await db.moderationServices.where('[address+chainId]').equals([ms.address, Number(chain.id)]).first()
        if (!modService) return
          if (modService.subscribed === 1) {
            setJoined(true)
          } else {
            setJoined(false)
          }
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
