import {
  useEffect,
  useCallback,
  useState,
  useContext
} from 'react'

import {
  useContracts
} from '@/hooks/useContracts'

import {
  getContract
} from 'viem'

import ModerationService from '@/assets/abi/ModerationService.json'
import {
  usePublicClient,
  useAccount,
  useWalletClient
} from 'wagmi'

import { IDBContext } from '@/provider/IDBProvider'

export const useModerationServices = ({
  filter = null
}: {
  filter?: {
    where: string,
    equals: any
  }
} = {}) => {
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const { moderationServiceFactory } = useContracts()
  const [moderationServices, setModerationServices] = useState([])

  const fetchModerationServices = useCallback(async () => {
    if (
      moderationServiceFactory &&
      publicClient &&
      walletClient?.data && 
      db
    ) {
      if (filter) {
        const moderationServices = await db.moderationServices
          .where(filter.where).equals(filter.equals)
          .toArray()
        console.log('subbed mod services', moderationServices)
        const ms = moderationServices.map((modService) => {
          const instance = getContract({
            address: modService.address,
            abi: ModerationService.abi,
            client: {
              public: publicClient,
              wallet: walletClient.data
            }
          })
          return {
           instance,
           ...modService 
          }
        })
        setModerationServices(ms)
      } else {
      const modServiceContracts = await moderationServiceFactory.read.getModerationServices([])
      const moderationServices = await Promise.all(modServiceContracts.map(async (address) => {
        const instance = getContract({
          address,
          abi: ModerationService.abi,
          client: {
            public: publicClient,
            wallet: walletClient.data
          }
        })
        const owner = await instance.read.owner()
        const name = await instance.read.name()
        const uri = await instance.read.uri()
        const port = await instance.read.port()
        return {
          owner,
          address,
          instance,
          name,
          uri,
          port
        }
      }))
      setModerationServices(moderationServices)
      }
    }
  }, [
    moderationServiceFactory,
    publicClient,
    walletClient?.data,
    db
  ])

  useEffect(() => {
    if (isInitialized ||
      !moderationServiceFactory ||
      !publicClient ||
      !walletClient?.data ||
      !db
       ) return

      const init = async () => {
        await fetchModerationServices()
        setIsInitialized(true)
      }
      init()

  }, [
    isInitialized,
    publicClient,
    walletClient?.data,
    moderationServiceFactory,
    fetchModerationServices,
    db
  ])

  return {
    moderationServices
  }

}
