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
  
  const [ hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])

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
        const unwatch  =  moderationServiceFactory.watchEvent.NewModerationService(
          {
            owner: address
          },
          { 
            onError: (error) => {
              console.log('error', error)
              setLogErrors(old => [...old, error])
            },
            onLogs: (logs) => {
             console.log('logs', logs)
             setLogs(old => [...old, ...logs])
             unwatch()
            }
          }
        )
        setHash(await moderationServiceFactory.write.createModerationService([
          name, uri, port
        ]))

      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  },[moderationServiceFactory, address])


  return {
    hash,
    logs,
    logErrors,
    createModerationService,
  }
}
