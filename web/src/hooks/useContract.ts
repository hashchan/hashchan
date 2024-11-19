import { useEffect, useState, useCallback } from 'react'
import HashChan2 from '@/assets/HashChan2.json'
import { useAccount   } from 'wagmi'

export const useContract = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { chain } = useAccount()
  const [contractAddress, setContractAddress] = useState(null)
  const fetchContract = useCallback(async () => {
    if (chain) {
    console.log('chain', chain.id)
      switch (chain.id) {
        case 61:
          setContractAddress(HashChan2.addressETC)
        break;
        case 1:
          setContractAddress(HashChan2.addressMainnet)
        break;
        case 10:
          setContractAddress(HashChan2.addressOptimism)
        break;
        case 250:
          setContractAddress(HashChan2.addressFantom)
        break;
        case 8453:
          setContractAddress(HashChan2.addressBase)
        break;
        case 42161:
          setContractAddress(HashChan2.addressArbitrum)
        break;
        case 42170:
          setContractAddress(HashChan2.addressNova)
        break;
        case 747:
          setContractAddress(HashChan2.addressFlow)
        break;
        case 11155111:
          setContractAddress(HashChan2.addressSepolia)
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
    abi: HashChan2.abi
  }
}

