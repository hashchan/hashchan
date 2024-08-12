import { useState, useEffect, useCallback } from 'react'
import { useWalletClient, usePublicClient, useAccount } from 'wagmi'
import { parseEther } from 'viem'
import { sendTransaction } from '@wagmi/core'
import {config} from '@/config'
export const useTip = () => {
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const publicClient = usePublicClient();

  const createTip = useCallback(async (
    receiver: `0x${string}`,
    amount: string
  ) => {
    console.log('hi')
    if (publicClient && walletClient && address) {
      try {
        const hash = await sendTransaction(config, {
          to: receiver,
          value: parseEther(amount)
        })

        const receipt = await publicClient.waitForTransactionReceipt({hash})
        return {
          hash,
          receipt,
          error: null
        }
      } catch (e) {
        console.log(e)
        return {
          hash: null,
          receipt: null,
          error: e
        }
      }
    }
  }, [walletClient, address,  publicClient])


  return {
    createTip
  }
}

        

