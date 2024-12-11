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


export const useEditModerationService = (instance: any) => {
  const { helia } = useContext(HeliaContext)
  const { address, chain } = useAccount()
  
  const [ hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])

  const editUrl = useCallback(async ({
    uri,
    port
  }:{
    name: string
    uri: string
    port: number
  }) => {
    if ( instance && address) {
      try {
        const unwatch  =  instance.watchEvent.URLUpdated(
          {
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
        setHash(await instance.write.setURL([
          uri, port
        ]))

      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  },[instance, address])


  return {
    hash,
    logs,
    logErrors,
    editUrl,
  }
}
