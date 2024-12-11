import {
  useContext,
  useState,
  useCallback
} from 'react'

import { IDBContext } from '@/provider/IDBProvider'
import { useContracts } from '@/hooks/useContracts'

import { useBoard } from '@/hooks/HashChan/useBoard'
import { computeImageCID } from '@/utils/cids'


export const useCreateThread = () => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard()
  const { hashchan } = useContracts()
 
  const [hash, setHash] = useState(null)
  const [receipt, setReceipt] = useState(null)
  const [logs, setLogs] = useState([])
  const [threadId, setThreadId] = useState(null)

  const [logErrors, setLogErrors] = useState([])

  const createThread = useCallback(async (
    title: string,
    imageUrl: string,
    content: string
  )  => {
    if (db && board && hashchan) {
      const address = hashchan.client.wallet?.account.address
      const chainId = hashchan.client.chain?.id

      if (!address || !chainId) {
        return {
          success: false,
          error: "Wallet not connected or chain not available"
        }
      }

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        return {
          success: false,
          error
        }
      }
      try {
        const unwatch = hashchan.watchEvent.ThreadCreated(
          {
            boardId: board.boardId,
            creator: address
          },
          {
            onError: (error) => {
              console.log('error', error)
              setLogErrors(old => [...old, error.message])
            },
            onLogs: async (logs) => {
              console.log('logs', logs)
              setLogs(logs)
              setThreadId(logs[0].args.threadId)
              // maybe lastsynced here
              await db.threads.add(logs[0].args)
              unwatch()
              return {
                success: true,
                error: null
              }
            }
          }
        )
        const hash = await hashchan.write.createThread([
          board.boardId,
          title,
          cid,
          content
        ])
        setHash(hash)

        // Wait for the transaction receipt
        const receipt = await hashchan.client.public.waitForTransactionReceipt({ 
          hash 
        })
        setReceipt(receipt)

        return {
          success: true,
          error: null,
        }
      } catch (e) {
        console.error(e)
        return {
          success: false,
          error: e.message
        }
      }
    }
    return {
      success: false,
      error: "Initialization error: required dependencies not available"
    }
  }, [
    hashchan,
    db,
    board
  ])

  return {
    hash,
    receipt,
    logs,
    logErrors,
    threadId,
    createThread
  }
}
