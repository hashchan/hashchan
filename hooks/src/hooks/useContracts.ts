import { useEffect, useState, useCallback } from 'react'
import { getContract } from 'viem'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'

import HashChan3 from '../abi/HashChan3.json'
import ModerationServiceFactory from '../abi/ModerationServiceFactory.json'

export const useContracts = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { chain } = useAccount()
  const publicClient = usePublicClient()
  const walletClient = useWalletClient()

  const [hashchan, setHashchan] = useState<any>(null)
  const [moderationServiceFactory, setModerationServiceFactory] = useState<any>(null)

  const fetchContracts = useCallback(async () => {
    if (!publicClient || !walletClient?.data || !chain?.id) return

    type AddressBook = Record<string, { address: `0x${string}` } | undefined>
    const chainKey = String(chain.id)
    const hc3Address = (HashChan3 as unknown as AddressBook)[chainKey]?.address
    const msfAddress = (ModerationServiceFactory as unknown as AddressBook)[chainKey]?.address

    if (hc3Address) {
      setHashchan(
        getContract({
          address: hc3Address,
          abi: HashChan3.abi,
          client: { public: publicClient, wallet: walletClient.data },
        })
      )
    }

    if (msfAddress) {
      setModerationServiceFactory(
        getContract({
          address: msfAddress,
          abi: ModerationServiceFactory.abi,
          client: { public: publicClient, wallet: walletClient.data },
        })
      )
    }
  }, [publicClient, walletClient?.data, chain?.id])

  useEffect(() => {
    setHashchan(null)
    setModerationServiceFactory(null)
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

  return { hashchan, moderationServiceFactory }
}
