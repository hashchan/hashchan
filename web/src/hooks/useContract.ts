import { useEffect, useState, useCallback } from 'react'
import {
  abi,
  mainnet,
  optimism,
  classic,
  polygon,
  fantom,
  flow,
  localhost,
  base,
  arbitrum,
  nova,
  avalanche,
  sepolia,
} from '@/assets/HashChan2.json'
import { useAccount   } from 'wagmi'

export const useContract = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { chain } = useAccount()
  const [contract, setContract] = useState(null)
  const [contractAddress, setContractAddress] = useState(null)
  const [firstBlock, setFirstBlock] = useState(null)
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

  useEffect(() => {
    setIsInitialized(false)
  }, [chain])

  useEffect(() => {
    if (isInitialized || !chain) return
      const init = async () => {
        await fetchContract()
        setIsInitialized(true)
      }
      init()
  }, [fetchContract, chain, isInitialized])

  return {
    contractAddress: contractAddress as `0x${string}`,
    firstBlock,
    abi
  }
}

