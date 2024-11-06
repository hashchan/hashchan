import { useEffect, useState, useCallback } from 'react'
import HashChan from '@/assets/HashChan.json'
import { useAccount   } from 'wagmi'

export const useContract = () => {
  const { chain } = useAccount()
  const [contractAddress, setContractAddress] = useState(null)
  const fetchContract = useCallback(async () => {
    if (chain) {
    console.log('chain', chain.id)
      switch (chain.id) {
        case 84532:
          setContractAddress(HashChan.baseSepoliaAddress)
        break;
        case 8453:
          setContractAddress(HashChan.baseAddress)
        break;
        default:
          setContractAddress(HashChan.address)
      }
    }
  }, [chain])

  useEffect(() => {
    if (chain) fetchContract()
  }, [fetchContract, chain])

  return {
    contractAddress: contractAddress as `0x${string}`,
    abi: HashChan.abi
  }
}

