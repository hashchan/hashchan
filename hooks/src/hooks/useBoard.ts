import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useConnection, usePublicClient } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { boardKey, boardsKey } from '../utils/queryKeys'

export const useBoard = (boardId: number, chainId: number) => {
  const { hashchan } = useContracts()
  const publicClient = usePublicClient()
  const { chain } = useConnection()
  const { db, sanitize } = useContext(IDBContext)
  const queryClient = useQueryClient()

  const { data: board } = useQuery({
    queryKey: boardKey({ chainId, boardId }),
    enabled: Boolean(chain && db && boardId != null && chainId != null && publicClient && hashchan),
    queryFn: async () => {
      let board = await db!.boards
        .where('[boardId+chainId]')
        .equals([boardId, chainId])
        .first()

      if (!board) {
        const logs = await hashchan.getEvents.NewBoard({ boardId: BigInt(boardId) })
        const log = logs[0]
        if (!log) return null

        const { boardId: boardIdBigInt, name, symbol, description, bannerUrl, bannerCID, rules } = log.args
        board = {
          boardId: Number(boardIdBigInt),
          chainId: chain!.id,
          favourite: 0,
          name: name ?? '',
          symbol: symbol ?? '',
          description: description ?? '',
          bannerUrl: bannerUrl ?? '',
          bannerCID: bannerCID ?? '',
          rules: rules ?? [],
          lastSynced: 0,
          metadata: { stats: { threadCount: 0, postCount: 0 } },
        }

        try {
          await db!.boards.add(board)
        } catch (e) {
          console.log('db error, skipping')
        }
      }

      if (!board) return null
      return {
        ...board,
        description: sanitize(board.description),
        rules: board.rules.map(sanitize),
      }
    },
  })

  const updateMetadataMutation = useMutation({
    mutationFn: async (increment: { threadCount?: number; postCount?: number }) => {
      if (!board) throw new Error('Board not loaded')

      await db!.boards
        .where('[boardId+chainId]')
        .equals([board.boardId, board.chainId])
        .modify((b) => {
          if (!b.metadata) b.metadata = { stats: { threadCount: 0, postCount: 0 } }
          if (increment.threadCount) b.metadata.stats.threadCount += increment.threadCount
          if (increment.postCount) b.metadata.stats.postCount += increment.postCount
        })

      return db!.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).first()
    },
    onSuccess: (updatedBoard) => {
      if (updatedBoard) {
        queryClient.setQueryData(boardKey({ chainId, boardId }), updatedBoard)
      }
      queryClient.invalidateQueries({ queryKey: boardsKey({ chainId }) })
    },
  })

  return {
    board: board ?? null,
    updateMetadata: updateMetadataMutation.mutate,
  }
}
