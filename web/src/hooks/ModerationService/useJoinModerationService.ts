import {
  useEffect,
  useState,
  useCallback,
  useContext
} from 'react'

import {
  useContracts
} from '@/hooks/useContracts'

import {
  useAccount
} from 'wagmi'

import {
  HeliaContext
} from '@/provider/HeliaProvider'

import {
  IDBContext
} from '@/provider/IDBProvider'

import { multiaddr  } from '@multiformats/multiaddr'
export const useJoinModerationService = (ms: any) => {
  const { helia } = useContext(HeliaContext)
  const { chain } = useAccount()
  const { db } = useContext(IDBContext)
  const [joined, setJoined] = useState(false)
  const [dial, setDial] = useState(null)
  const [dialErrors, setDialErrors] = useState([])

  const joinModerationService = useCallback(async () => {
    if ( helia && db && ms && chain?.id ) {  
      try {

        const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
        console.log('dial', dial)
        console.log('ms', ms)
        await db.moderationServices.add({
          subscribed: 1,
          uri: ms.uri,
          name: ms.name,
          port: ms.port,
          address: ms.address,
          chainId: Number(chain.id),
          owner: ms.owner
        })

        setDial(dial)

        setJoined(true)

      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms, chain?.id])
  
  const leaveModerationService = useCallback(async () => {
    if ( helia && db && ms && chain?.id ) {  
      try {
        setJoined(false)
        try {
          await db.moderationServices.where('[chainId+address]').equals([Number(chain.id), ms.address]).modify({subscribed: 0})
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
        const modService = await db.moderationServices.where('[chainId+address]').equals([Number(chain.id), ms.address]).first()
        if (modService) {
          setJoined(true)
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
