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
    where: string,
    equals: any
  }
} = {}) => {
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)

  const { chain } = useAccount() 
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const { moderationServiceFactory } = useContracts()
  const [moderationServices, setModerationServices] = useState([])


  const fetchModerationService = useCallback(async (address) => {
    if (
      moderationServiceFactory &&
      publicClient &&
      walletClient?.data &&
      chain?.id
    ) {
      const instance = getContract({
        address,
        abi: ModerationService.abi,
        client: {
          public: publicClient,
          wallet: walletClient.data
        }
      })
      const owner = await instance.read.owner()
      const [name, uri, port, positives, negatives] =
        await instance.read.getServiceData()
      console.log(name, uri, port, positives, negatives)

      const filter = await publicClient.createContractEventFilter({
        address,
        abi: ModerationService.abi,
        eventName: 'NewJanitor',
        fromBlock: 0n,
        toBlock: 'latest'
      })
      const newJanitorEvents = await publicClient.getFilterLogs({filter})
      console.log('newJanitorEvent', newJanitorEvents)
      const janitors = await Promise.all(
        newJanitorEvents.map(async (event) => {
          const janitor = event.args.janitor
          const data = await instance.read.getJanitor([janitor])
          return {
            janitor,
            ...data
          }
      }))
      console.log('janitors', janitors)



      setModerationServices([{
        owner,
        address,
        instance,
        name,
        uri,
        port,
        positives,
        negatives,
        janitors
      }])
    }
  }, [
    moderationServiceFactory,
    publicClient,
    walletClient?.data,
    chain?.id
  ])
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
        const [name, uri, port, positives, negatives] =
          await instance.read.getServiceData()
        return {
          owner,
          address,
          instance,
          name,
          uri,
          port,
          positives,
          negatives
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
    moderationServices,
    fetchModerationService
  }

}
