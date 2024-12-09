import {
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'

import { IDBContext } from '@/provider/IDBProvider'
import { useContract } from '@/hooks/useContract'
import { useWalletClient, useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'

import { parseEventLogs } from 'viem'
import { useBoard } from '@/hooks/useBoard'
import { config } from '@/config'
import { computeImageCID } from '@/utils/cids'

export const useCreateThread = () => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard()
  const { address, chain } = useAccount()
  const { contractAddress, abi } = useContract()
  const walletClient = useWalletClient()
  const [threadId, setThreadId] = useState(null)

  const createThread = useCallback(async (
    boardSymbol: string,
    title: string,
    imageUrl: string,
    content: string
  ) => {
    if (walletClient && address && chain && db && board && contractAddress) {

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        return {
          hash: null,
          error
        }
      }
      try {
        const tx = await writeContract(config, {
          address: contractAddress,
          abi,
          functionName: 'createThread',
          args: [
            board.boardId,
            title,
            imageUrl,
            cid,
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


        setThreadId(logs[0].args.threadId)

        await db.threads.add(logs[0].args)

        /*
        await db.threads.add({
          threadId: logs[0].args.id,
          boardId: logs[0].args.boardId,
          creator: logs[0].args.creator,
          imgUrl: logs[0].args.imgUrl,
          imgCID: logs[0].args.imgCID,
          title: logs[0].args.title,
          content: logs[0].args.content,
          timestamp: logs[0].args.timestamp
        })
       */
        return  {
          hash: logs[0].args.threadId,
          error: null
        }
      }  catch (e) {
        return {
          hash: null,
          error: e
        }
      }
    } else {
      return {
        hash: null,
        error: 'initialization error'
      }
    }
  }, [
    address,
    walletClient,
    chain,
    contractAddress,
    abi,
    db,
    board
  ])

  return {
    threadId,
    createThread
  }
}
