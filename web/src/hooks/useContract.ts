import { useEffect, useState, useCallback } from 'react'
import HashChan2 from '@/assets/HashChan2.json'
import { useAccount   } from 'wagmi'

export const useContract = () => {
  const { chain } = useAccount()
  const [contractAddress, setContractAddress] = useState(null)
  const fetchContract = useCallback(async () => {
    if (chain) {
    console.log('chain', chain.id)
      switch (chain.id) {
        case 84532:
          setContractAddress(HashChan2.baseSepoliaAddress)
        break;
        /*
        case 8453:
          setContractAddress(HashChan.baseAddress)
        break;
       */
        default:
          setContractAddress(HashChan2.address)
      }
    }
  }, [chain])

  useEffect(() => {
    if (chain) fetchContract()
  }, [fetchContract, chain])

  return {
    contractAddress: contractAddress as `0x${string}`,
    abi: HashChan2.abi
  }
}

