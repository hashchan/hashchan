import {
  useEffect,
  useCallback,
  useState,
} from 'react'

import {
  useContracts
} from '@/hooks/useContracts'


export const useModerationServices = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { moderationServiceFactory } = useContracts()
  const [moderationServices, setModerationServices] = useState([])

  const fetchModerationServices = useCallback(async () => {
    if (moderationServiceFactory) {
      const moderationServices = await moderationServiceFactory.read.modServices([0n])
      console.log('moderationServices', moderationServices)
      setModerationServices(moderationServices)
    }
  }, [
    moderationServiceFactory
  ])

  useEffect(() => {
    if (isInitialized ||
      !moderationServiceFactory ) return

      const init = async () => {
        await fetchModerationServices()
        setIsInitialized(true)
      }
      init()

  }, [isInitialized, moderationServiceFactory, fetchModerationServices])

  return {
    moderationServices
  }

}
