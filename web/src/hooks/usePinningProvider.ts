import { useEffect, useState, useContext, useCallback } from 'react'

import { HeliaContext } from '@/provider/HeliaProvider'

export const useW3Storage = () => {
  const [isConnected, setIsConnected] = useState(false)
 const {startHelia} = useContext(HeliaContext)
  const connectPinningProvider = useCallback(async (
    endpointUrl: string,
    accessToken : string
  ) => {
    try {
      const remotePin = {
        endpointUrl,
        accessToken
      }

      localStorage.setItem('remote-pin', JSON.stringify(remotePin))
      startHelia()
      setIsConnected(true)
    } catch (e) {
      console.log('e', e)
    }
  }, [startHelia])

  useEffect(() => {
    const remotePin = JSON.parse(localStorage.getItem('remote-pin'))
    if (Object.keys(remotePin).length > 0) {
     setIsConnected(true) 
    }

  },[])

  return {
    connectPinningProvider,
    isConnected
  }
}
