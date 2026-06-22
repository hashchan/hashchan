import { useContext, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { computeImageCID } from '../utils/cids'

export const useCreatePost = (boardId: number, chainId: number, threadId: string) => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard(boardId, chainId)
  const { hashchan } = useContracts()
  const { address } = useAccount()

  const [hash, setHash] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logErrors, setLogErrors] = useState<any[]>([])

  const createPost = useCallback(
    async (imageUrl: string, content: string, replyIds: string[]) => {
      if (!db || !board || !hashchan || !address || !threadId) return

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        setLogErrors((old) => [...old, error])
      }

      try {
        const unwatch = hashchan.watchEvent.NewPost(
          { threadId, creator: address },
          {
            onError: (error: any) => {
              setLogErrors((old) => [...old, error.message])
            },
            onLogs: async (newLogs: any[]) => {
              setLogs((old) => [...old, ...newLogs])
              unwatch()
            },
          }
        )

        const txHash = await hashchan.write.createPost([
          board.boardId,
          threadId,
          replyIds,
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
    [hashchan, db, board, address, threadId]
  )

  return { hash, logs, logErrors, threadId, createPost }
}
