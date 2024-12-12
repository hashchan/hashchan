import { useState, useEffect, useCallback } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { sendTransaction } from '@wagmi/core'
import {config} from '@/config'
export const useJannyPost = () => {
  const [signature, setSignature] = useState(null)
  const [response, setResponse] = useState(null)
  const [logErrors, setLogErrors] = useState([])
  
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient();

  const jannyPost = useCallback(async (
    postId: `0x${string}`,
    rule: number
  ) => {

  }, [])


  return {
    jannyPost,
    signature,
    response,
    logErrors
  }
}

        

