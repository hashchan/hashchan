import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { useConnection, usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import ModerationServiceABI from '../abi/ModerationService.json'
import { moderationServiceKey } from '../utils/queryKeys'
import { type FilterLog, type NewJanitorArgs } from '../types/events'
import type { ModerationServiceData, JanitorData } from '../types/moderation'

export const useModerationService = (address: `0x${string}`) => {
  const { db } = useContext(IDBContext)
  const { chain } = useConnection()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  const { moderationServiceFactory } = useContracts()

  const enabled = Boolean(moderationServiceFactory && publicClient && walletClient?.data && chain?.id && db)

  const { data: moderationService, error, isLoading, status, refetch } = useQuery({
    queryKey: moderationServiceKey({ chainId: chain?.id ?? 0, address }),
    enabled,
    queryFn: async (): Promise<ModerationServiceData> => {
      const instance: any = getContract({
        address,
        abi: ModerationServiceABI.abi,
        client: { public: publicClient!, wallet: walletClient!.data! },
      })

      const [owner, name, uri, port, positives, negatives, totalWages] =
        await instance.read.getServiceData()

      const janitorFilter = await publicClient!.createContractEventFilter({
        address,
        abi: ModerationServiceABI.abi,
        eventName: 'NewJanitor',
        fromBlock: 0n,
        toBlock: 'latest',
      })
      const janitorLogs = await publicClient!.getFilterLogs({ filter: janitorFilter })

      const janitors: JanitorData[] = await Promise.all(
        janitorLogs.map(async (log) => {
          const { janitor } = (log as unknown as FilterLog<NewJanitorArgs>).args
          const data = await instance.read.getJanitor([janitor])
          return {
            janitor,
            positiveReviews: data.positiveReviews,
            negativeReviews: data.negativeReviews,
            started: data.started,
            claimedWages: data.claimedWages,
          }
        })
      )

      return { owner, address, name, uri, port: Number(port), positives, negatives, totalWages, instance, janitors }
    },
  })

  return { moderationService, error, isLoading, status, refetch }
}
