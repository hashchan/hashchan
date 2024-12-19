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
import { config } from '@/config'
export const useModerationServices = ({
  filter = null
}: {
  filter?: {
    where: object,
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
          .where(filter.where)
          .toArray()
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
        const [owner, name, uri, port, positives, negatives, totalWages] =
          await instance.read.getServiceData()
        return {
          owner,
          address,
          instance,
          name,
          uri,
          port,
          positives,
          negatives,
          totalWages
        }
      }))
      setModerationServices(moderationServices)
      }
    }
  }, [
    filter,
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
        console.log('fetching mode services')
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
    db,
  ])

  return {
    moderationServices
  }

}
