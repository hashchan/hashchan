import { useContext, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { computeImageCID } from '../utils/cids'
import { type NewThreadArgs } from '../types/events'

export const useCreateThread = (boardId: number, chainId: number) => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard(boardId, chainId)
  const { hashchan } = useContracts()
  const { address } = useAccount()

  const [hash, setHash] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [threadId, setThreadId] = useState<string | null>(null)
  const [logErrors, setLogErrors] = useState<any[]>([])

  const createThread = useCallback(
    async (title: string, imageUrl: string, content: string) => {
      if (!db || !board || !hashchan || !address || !chainId) return

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        setLogErrors((old) => [...old, error])
      }

      try {
        const unwatch = hashchan.watchEvent.NewThread(
          { boardId: board.boardId, creator: address },
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
            },
            onLogs: async (newLogs: Array<{ args: NewThreadArgs }>) => {
              setLogs(newLogs)
              setThreadId(newLogs[0].args.threadId)
              unwatch()
            },
          }
        )

        const txHash = await hashchan.write.createThread([
          board.boardId,
          title,
          imageUrl,
          cid,
          content,
        ])
        setHash(txHash)
      } catch (e) {
        console.error(e)
        setLogErrors((old) => [...old, e])
      }
    },
    [hashchan, db, board, address, chainId]
  )

  return { hash, logs, logErrors, threadId, createThread }
}
