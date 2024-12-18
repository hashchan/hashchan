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

export const useModerationService = ({address}:{address:`0x${string}`}) => {
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)

  const { chain } = useAccount() 
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const { moderationServiceFactory } = useContracts()
  const [moderationService, setModerationService] = useState()


  const fetchModerationService = useCallback(async () => {
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
      const [owner, name, uri, port, positives, negatives, totalWages] =
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

      setModerationService({
        owner,
        address,
        instance,
        name,
        uri,
        port,
        positives,
        negatives,
        janitors,
        totalWages
      })
    }
  }, [
    address,
    moderationServiceFactory,
    publicClient,
    walletClient?.data,
    chain?.id
  ])

  useEffect(() => {
    if (isInitialized ||
      !moderationServiceFactory ||
      !publicClient ||
      !walletClient?.data ||
      !db
       ) return

      const init = async () => {
        await fetchModerationService()
        setIsInitialized(true)
      }
      init()

  }, [
    isInitialized,
    publicClient,
    walletClient?.data,
    moderationServiceFactory,
    fetchModerationService,
    db
  ])

  return {
    moderationService,
    fetchModerationService
  }

}
