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


export const useCreateModerationService = () => {
  const { helia } = useContext(HeliaContext)
  const { moderationServiceFactory } = useContracts()
  const { address, chain } = useAccount()
  
  const [logErrors, setLogErrors] = useState([])
  const [ hash, setHash] = useState(null)
  const [ receipt, setReceipt] = useState(null)
  const [unwatch, setUnwatch] = useState(null)

  const createModerationService = useCallback(async ({
    name,
    uri,
    port
  }:{
    name: string
    uri: string
    port: number
  }) => {
    if ( moderationServiceFactory && address) {
      try {
        setUnwatch(moderationServiceFactory.watchEvent.ModerationServiceCreated(
          {
            owner: address,
            name: name
          },
          { 
            onError: (error) => {
              console.log('error', error)
              setLogErrors(old => [...old, error.message])
            },
            onLogs: (logs) => {
             console.log('logs', logs)
             setReceipt(logs[0].receipt)
            }
          }
        ))
        setHash(await moderationServiceFactory.write.createModerationService([
          name, uri, port
        ]))

      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  },[moderationServiceFactory, address])

  useEffect(() => {
    return () => {
      if (unwatch) {
        unwatch()
      }
    }
  })

  return {
    hash,
    receipt,
    createModerationService,
    logErrors
  }
}
