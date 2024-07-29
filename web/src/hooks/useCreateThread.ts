import { useState, useEffect, useCallback } from 'react'
import { abi, address as hashChanAddress } from '@/assets/HashChan.json'
import { useWalletClient, useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'

import { parseEventLogs } from 'viem'

import { config } from '@/config'
import { boardsMap } from '@/utils'

export const useCreateThread = () => {
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const [threadId, setThreadId] = useState(null)

  const createThread = useCallback(async (
    board: string,
    title: string,
    imageUrl: string,
    content: string
  ) => {
    if (walletClient && address) {
      try {
        const tx = await writeContract(config, {
          address: hashChanAddress as `0x${string}`,
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
  }, [address, walletClient])


  return {
    threadId,
    createThread
  }
}
