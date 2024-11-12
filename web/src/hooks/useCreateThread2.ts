import { useState, useEffect, useCallback } from 'react'
import { useContract } from '@/hooks/useContract2'
import { useWalletClient, useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'

import { parseEventLogs } from 'viem'

import { config } from '@/config'
import { boardsMap } from '@/utils'

export const useCreateThread2 = () => {
  const { address, chain } = useAccount()
  const { contractAddress, abi } = useContract()
  const walletClient = useWalletClient()
  const [threadId, setThreadId] = useState(null)

  const createThread = useCallback(async (
    board: string,
    title: string,
    imageUrl: string,
    content: string
  ) => {
    console.log('hashchan2: ', contractAddress)
    if (walletClient && address && chain) {
      console.log('chain', chain)
      try {
        const tx = await writeContract(config, {
          address: contractAddress,
          abi,
          functionName: 'createThread',
          args: [
            boardsMap[board],
            title,
            imageUrl,
            content
          ]
        })

        console.log('tx', tx)
        const receipt = await waitForTransactionReceipt(config, {
          hash: tx
        })
        console.log('receipt', receipt)
        const logs = parseEventLogs({
          abi,
          logs: receipt.logs
        })
        console.log('logs', logs)
        setThreadId(logs[0].args.id)
        return  {
          hash: logs[0].args.id,
          error: null
        }
      }  catch (e) {
        return {
          hash: null,
          error: e
        }
      }
    }
  }, [address, walletClient, chain, contractAddress, abi])


  return {
    threadId,
    createThread
  }
}
