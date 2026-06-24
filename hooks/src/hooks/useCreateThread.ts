import { useContext, useState, useCallback } from 'react'
import { useConnection } from 'wagmi'

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
      const missing = checkDeps({ db, board, hashchan, address, chainId })
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
        const unwatch = hashchan.watchEvent.NewThread(
          { boardId: board!.boardId, creator: address },
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: async (newLogs: FilterLog<NewThreadArgs>[]) => {
              setLogs(newLogs)
              setThreadId(newLogs[0].args.threadId)
              setStatus('confirmed')
              unwatch()
            },
          }
        )

        const txHash = await hashchan.write.createThread([
          board!.boardId,
          title,
          imageUrl,
          cid,
          content,
        ])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [hashchan, db, board, address, chainId]
  )

  return { status, hash, logs, logErrors, threadId, reset, createThread }
}
