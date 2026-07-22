import { useEffect, useState, useCallback } from 'react'
import { getContract } from 'viem'
import { useConnection, usePublicClient, useWalletClient } from 'wagmi'

import HashChan3 from '../abi/HashChan3.json'
import ModerationServiceFactory from '../abi/ModerationServiceFactory.json'

export const useContracts = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { chain } = useConnection()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()

  const [hashchan, setHashchan] = useState<any>(null)
  const [moderationServiceFactory, setModerationServiceFactory] = useState<any>(null)
  const [hashchanDeployedAtBlock, setHashchanDeployedAtBlock] = useState<bigint | null>(null)
  const [moderationServiceFactoryDeployedAtBlock, setModerationServiceFactoryDeployedAtBlock] = useState<bigint | null>(null)

  const fetchContracts = useCallback(async () => {
    if (!publicClient || !walletClient?.data || !chain?.id) return

    type AddressBook = Record<string, { address: `0x${string}`; deployedAtBlock?: number } | undefined>
    const chainKey = String(chain.id)
    const hc3Entry = (HashChan3 as unknown as AddressBook)[chainKey]
    const msfEntry = (ModerationServiceFactory as unknown as AddressBook)[chainKey]

    if (hc3Entry) {
      setHashchan(
        getContract({
          address: hc3Entry.address,
          abi: HashChan3.abi,
          client: { public: publicClient, wallet: walletClient.data },
        })
      )
      // Test chains injected at runtime (see test/utils/wrapper.tsx) have no
      // deployedAtBlock entry — default to 0 (genesis) rather than blocking.
      setHashchanDeployedAtBlock(BigInt(hc3Entry.deployedAtBlock ?? 0))
    }

    if (msfEntry) {
      setModerationServiceFactory(
        getContract({
          address: msfEntry.address,
          abi: ModerationServiceFactory.abi,
          client: { public: publicClient, wallet: walletClient.data },
        })
      )
      setModerationServiceFactoryDeployedAtBlock(BigInt(msfEntry.deployedAtBlock ?? 0))
    }
  }, [publicClient, walletClient?.data, chain?.id])

  useEffect(() => {
    setHashchan(null)
    setModerationServiceFactory(null)
    setHashchanDeployedAtBlock(null)
    setModerationServiceFactoryDeployedAtBlock(null)
    setIsInitialized(false)
  }, [chain?.id])

  useEffect(() => {
    if (isInitialized || !chain?.id || !publicClient || !walletClient?.data) return
    const init = async () => {
      await fetchContracts()
      setIsInitialized(true)
    }
    init()
  }, [fetchContracts, chain?.id, isInitialized, publicClient, walletClient?.data])

  return { hashchan, moderationServiceFactory, hashchanDeployedAtBlock, moderationServiceFactoryDeployedAtBlock }
}
