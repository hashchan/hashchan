import { useContext, useState, useCallback } from 'react'
import { useConnection, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { computeImageCID } from '../utils/cids'
import { type NewPostArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreatePost = (boardId: number, chainId: number, threadId: string) => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard(boardId, chainId)
  const { hashchan } = useContracts()
  const { address } = useConnection()
  const publicClient = usePublicClient()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [logs, setLogs] = useState<FilterLog<NewPostArgs>[]>([])
  const [logErrors, setLogErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(null)
    setLogs([])
    setLogErrors([])
  }, [])

  const createPost = useCallback(
    async (imageUrl: string, content: string, replyIds: string[]) => {
      const missing = checkDeps({ db, board, hashchan, address, threadId, publicClient })
      if (missing.length > 0) {
        console.debug('[hashchan] createPost not ready:', missing.join(', '))
        return
      }

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        setLogErrors((old) => [...old, error])
        setStatus('error')
        return
      }

      setStatus('submitting')

      try {
        const txHash = await hashchan.write.createPost([
          board!.boardId,
          threadId,
          replyIds,
          imageUrl,
          cid,
          content,
        ])
        setHash(txHash)
        setStatus('pending')

        // Decode straight from this transaction's own receipt instead of a
        // watchEvent race filtered only by (threadId, creator), which matches
        // any post the same account makes on this thread around the same time.
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const newLogs = parseEventLogs({
          abi: hashchan.abi,
          eventName: 'NewPost',
          logs: receipt.logs,
        }) as unknown as FilterLog<NewPostArgs>[]

        if (newLogs.length === 0) {
          setLogErrors((old) => [...old, 'NewPost event not found in transaction receipt'])
          setStatus('error')
          return
        }

        setLogs((old) => [...old, ...newLogs])
        setStatus('confirmed')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [hashchan, db, board, address, threadId, publicClient]
  )

  return { status, hash, logs, logErrors, reset, createPost }
}
