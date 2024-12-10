import { useEffect, useState, useCallback } from 'react'
import HashChan3 from '@/assets/abi/HashChan3.json'
import ModerationServiceFactory from '@/assets/abi/ModerationServiceFactory.json'
import ModerationService from '@/assets/abi/ModerationService.json'

import { getContract } from 'viem'

import {
  useAccount,
  usePublicClient,
  useWalletClient 
} from 'wagmi'

export const useContracts = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { chain } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient();

  const [hashchan, setHashchan] = useState(null)
  const [moderationService, setModerationService] = useState(null)
  const [moderationServiceFactory, setModerationServiceFactory] = useState(null)

  const fetchContracts = useCallback(async () => {
    if (publicClient && walletClient?.data && chain?.id) {
      setHashchan(getContract({
        address: HashChan3[chain.id].address,
        abi: HashChan3.abi,
        client: {
          public: publicClient,
          wallet: walletClient.data
        }
      }))
      const modFactory = getContract({
        address: ModerationServiceFactory[chain.id].address,
        abi: ModerationServiceFactory.abi,
        client: {
          public: publicClient,
          wallet: walletClient.data
        } 
      })

      setModerationServiceFactory(modFactory)
    }
  }, [publicClient, walletClient?.data, chain?.id])

  useEffect(() => {
    setIsInitialized(false)
  }, [chain?.id])

  useEffect(() => {
    if (
      isInitialized ||
      !chain?.id ||
      !publicClient ||
      !walletClient?.data
    ) return

    const init = async () => {
      await fetchContracts()
      setIsInitialized(true)
    }
    init()
  }, [
    fetchContracts,
    chain?.id,
    isInitialized,
    publicClient,
    walletClient?.data
  ])

  return {
    hashchan,
    moderationService,
    moderationServiceFactory
  }
}


/*
   const fetchContract = useCallback(async () => {
   if (chain) {
   switch (chain.id) {
   case 1:
   setContractAddress(mainnet.address)
   setFirstBlock(mainnet.firstBlock)
   break;
   case 10:
   setContractAddress(optimism.address)
   setFirstBlock(optimism.firstBlock)
   break;
   case 61:
   setContractAddress(classic.address)
   setFirstBlock(classic.firstBlock)
   break;
   case 137:
   setContractAddress(polygon.address)
   setFirstBlock(polygon.firstBlock)
   break;
   case 250:
   setContractAddress(fantom.address)
   setFirstBlock(fantom.firstBlock)
   break;
   case 747:
   setContractAddress(flow.address)
   setFirstBlock(flow.firstBlock)
   break;
   case 1337:
   setContractAddress(localhost.address)
   setFirstBlock(localhost.firstBlock)
   break;
   case 8453:
   setContractAddress(base.address)
   setFirstBlock(base.firstBlock)
   break;
   case 42161:
   setContractAddress(arbitrum.address)
   setFirstBlock(arbitrum.firstBlock)
   break;
   case 42170:
   setContractAddress(nova.address)
   setFirstBlock(nova.firstBlock)
   break;
   case 43114:
   setContractAddress(avalanche.address)
   setFirstBlock(avalanche.firstBlock)
   break;
   case 11155111:
   setContractAddress(sepolia.address)
   setFirstBlock(sepolia.firstBlock)
   break;
   }
   }
   }, [chain])

 */
