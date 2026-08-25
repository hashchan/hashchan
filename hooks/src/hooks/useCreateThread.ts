import { useContext, useState, useCallback } from 'react'
import { useConnection, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { computeImageCID } from '../utils/cids'
import { type NewThreadArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreateThread = (boardId: number, chainId: number) => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard(boardId, chainId)
  const { hashchan } = useContracts()
  const { address } = useConnection()
  const publicClient = usePublicClient()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [logs, setLogs] = useState<FilterLog<NewThreadArgs>[]>([])
  const [threadId, setThreadId] = useState<`0x${string}` | null>(null)
  const [logErrors, setLogErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(null)
    setLogs([])
    setThreadId(null)
    setLogErrors([])
  }, [])

  const createThread = useCallback(
    async (title: string, imageUrl: string, content: string) => {
      const missing = checkDeps({ db, board, hashchan, address, chainId, publicClient })
      if (missing.length > 0) {
        console.debug('[hashchan] createThread not ready:', missing.join(', '))
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
        const txHash = await hashchan.write.createThread([
          board!.boardId,
          title,
          imageUrl,
          cid,
          content,
        ])
        setHash(txHash)
        setStatus('pending')

        // Decode the event straight from this transaction's own receipt
        // instead of a separate watchEvent race against unrelated activity —
        // watchEvent filtered by (boardId, creator) alone, which matches any
        // thread the same account creates around the same time.
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const [newThreadLog] = parseEventLogs({
          abi: hashchan.abi,
          eventName: 'NewThread',
          logs: receipt.logs,
        }) as unknown as FilterLog<NewThreadArgs>[]

        if (!newThreadLog) {
          setLogErrors((old) => [...old, 'NewThread event not found in transaction receipt'])
          setStatus('error')
          return
        }

        // Persist immediately (mirrors useCreateBoard.ts) so the auto-navigate
        // into this thread finds it already cached instead of useThread.ts
        // having to fall back to its own unranged "not cached" scan — and so
        // blockCreatedAt is known from the start, keeping this thread's own
        // post-fetch floor tight instead of falling back to
        // hashchanDeployedAtBlock.
        const { threadId: tid, creator, imgUrl, imgCID, title: t, content: c, timestamp } = newThreadLog.args
        try {
          await db!.threads.add({
            lastSynced: 0,
            scannedSpans: [],
            blockCreatedAt: Number(newThreadLog.blockNumber),
            boardId: Number(board!.boardId),
            threadId: tid,
            creator,
            imgUrl,
            imgCID,
            title: t,
            content: c,
            bookmarked: 0,
            chainId: Number(board!.chainId),
            timestamp: Number(timestamp),
          })
        } catch (e) {
          console.log('Thread already cached (likely picked up by the live watcher first):', tid)
        }

        setLogs([newThreadLog])
        setThreadId(newThreadLog.args.threadId)
        setStatus('confirmed')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [hashchan, db, board, address, chainId, publicClient]
  )

  return { status, hash, logs, logErrors, threadId, reset, createThread }
}
