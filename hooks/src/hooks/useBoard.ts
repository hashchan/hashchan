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
        // A direct storage read (matches useBoards.ts's bulk loop) instead of
        // scanning NewBoard logs — instant, no block-range concerns at all,
        // and the event's only extra field (timestamp) was never even stored.
        const ethBoard = await hashchan.read.getBoard([BigInt(boardId)])
        if (!ethBoard?.name) return null

        board = {
          boardId,
          chainId: chain!.id,
          favourite: 0,
          name: ethBoard.name,
          symbol: ethBoard.symbol,
          description: ethBoard.description,
          bannerUrl: ethBoard.bannerUrl,
          bannerCID: ethBoard.bannerCID,
          rules: ethBoard.rules ?? [],
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
