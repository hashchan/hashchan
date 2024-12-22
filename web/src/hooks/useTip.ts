import { useState, useEffect, useCallback } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { sendTransaction } from '@wagmi/core'
import {config} from '@/config'
export const useTip = () => {
  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient();

  const createTip = useCallback(async (
    receiver: `0x${string}`,
    amount: string
  ) => {
    if (publicClient && walletClient && address) {
      try {
        const hash = await sendTransaction(config, {
          to: receiver,
          value: parseEther(amount)
        })
        setHash(hash)

        const tx = await publicClient.waitForTransactionReceipt({hash})
        setLogs(old => [...old, tx ])
      } catch (e) {
        console.log(e)
        setLogErrors(old => [...old, e.message])
      }
    }
  }, [walletClient, address,  publicClient])


  return {
    createTip,
    hash,
    logs,
    logErrors
  }
}

        

