import { useState, useEffect, useCallback } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { sendTransaction } from '@wagmi/core'
import {config} from '@/config'
export const useJannyPost = () => {
  const [hash, setHash] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [error, setError] = useState(null)
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient();

  const fetchJannyPost = useCallback(async (
    postId: `0x${string}`
  ) => {
    if (publicClient && walletClient && address) {
    }
  }, [walletClient, address,  publicClient])


  return {
    fetchJannyPost,
    hash,
    receipt,
    error
  }
}

        

