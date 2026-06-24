import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { useConnection, usePublicClient, useWalletClient } from 'wagmi'
import { getContract } from 'viem'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import ModerationServiceABI from '../abi/ModerationService.json'
import { moderationServicesKey } from '../utils/queryKeys'
import type { ModerationServiceData } from '../types/moderation'

export const useModerationServices = (filter?: { where: object }) => {
  const { db } = useContext(IDBContext)
  const { chainId } = useConnection()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()
  const { moderationServiceFactory } = useContracts()

  const serializedFilter = filter ? JSON.stringify(filter) : null
  const enabled = Boolean(moderationServiceFactory && publicClient && walletClient?.data && db && chainId)

  const { data: moderationServices = [], error, isLoading, status } = useQuery({
    queryKey: moderationServicesKey({ chainId: chainId!, filter: serializedFilter }),
    enabled,
    queryFn: async (): Promise<ModerationServiceData[]> => {
      const makeInstance = (address: `0x${string}`): any =>
        getContract({
          address,
          abi: ModerationServiceABI.abi,
          client: { public: publicClient!, wallet: walletClient!.data! },
        })

      if (filter) {
        const records = await db!.moderationServices.where(filter.where).toArray()
        return records.map((r) => ({
          owner: r.owner,
          address: r.address,
          name: r.name,
          uri: r.uri,
          port: r.port,
          positives: 0n,
          negatives: 0n,
          totalWages: 0n,
          subscribed: r.subscribed,
          orbitDbAddr: r.orbitDbAddr,
          instance: makeInstance(r.address),
        }))
      }

      const addresses = await moderationServiceFactory.read.getModerationServices([])
      return Promise.all(
        addresses.map(async (address: `0x${string}`) => {
          const instance = makeInstance(address)
          const [owner, name, uri, port, positives, negatives, totalWages] =
            await instance.read.getServiceData()
          return {
            owner,
            address,
            name,
            uri,
            port: Number(port),
            positives,
            negatives,
            totalWages,
            instance,
          }
        })
      )
    },
  })

  return { moderationServices, error, isLoading, status }
}
