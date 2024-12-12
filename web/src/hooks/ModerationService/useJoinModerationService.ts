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
  const { db } = useContext(IDBContext)
  const [dial, setDial] = useState(null)
  const [dialErrors, setDialErrors] = useState([])

  const joinModerationService = useCallback(async () => {
    if ( helia && db && ms ) {  
      try {

        const dial = await helia.libp2p.dial(multiaddr(`/dns4/${ms.uri}/tcp/${ms.port}/wss`))
        console.log('dial', dial)
        await db.moderationServices.add(ms)

        setDial(dial)

      } catch (e) {
        console.log(e)
        setDialErrors(old => [...old, e.message])
      }
    }
  },[helia, db, ms])


  return {
    joinModerationService,
    dial,
    dialErrors
  }
}
