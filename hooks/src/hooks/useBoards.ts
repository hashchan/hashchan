import { useContext } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useConnection, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useEnabled } from '../utils/enabled'
import { boardsKey } from '../utils/queryKeys'

export const useBoards = () => {
  const { address, chainId } = useConnection()
  const { db } = useContext(IDBContext)
  const blockNumber = useBlockNumber()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const enabled = useEnabled({ address, chainId, db, blockNumber: blockNumber.data, hashchan })

  const { sanitize } = useContext(IDBContext)

  const {
    data: boards = [],
    error,
    isLoading,
  } = useQuery({
    enabled,
    staleTime: 1000 * 60 * 5,
    queryKey: boardsKey({ chainId: chainId! }),
    queryFn: async () => {
      let boardsSync = await db!.boardsSync.where('chainId').equals(chainId!).first()
      if (!boardsSync) {
        boardsSync = { chainId: chainId!, lastSynced: 0, boardIterator: 0 }
        await db!.boardsSync.add(boardsSync)
      }

      const boards = await db!.boards.where('chainId').equals(chainId!).toArray()
      const boardCount = await hashchan.read.boardCount()

      const startId = boardsSync.boardIterator
      const endId = Number(boardCount)

      for (let i = startId; i < endId; i++) {
        const ethBoard = await hashchan.read.getBoard([BigInt(i)])
        if (!ethBoard) continue
        const newBoard = {
          boardId: i,
          chainId: chainId!,
          name: ethBoard.name,
          symbol: ethBoard.symbol,
          description: ethBoard.description,
          bannerUrl: ethBoard.bannerUrl,
          bannerCID: ethBoard.bannerCID,
          rules: ethBoard.rules,
          lastSynced: 0,
          favourite: 0,
          metadata: { stats: { threadCount: 0, postCount: 0 } },
        }
        try {
          await db!.boards.add(newBoard)
          boards.push(newBoard)
        } catch (e) {
          console.log('board already exists, skipping')
        }
      }

      await db!.boardsSync.where('chainId').equals(chainId!).modify({
        boardIterator: endId,
        lastSynced: Number(blockNumber.data),
      })

      return boards.map(b => ({
        ...b,
        description: sanitize(b.description),
        rules: b.rules.map(sanitize),
      }))
    },
  })

  const favouriteMutation = useMutation({
    mutationFn: async ({ boardId, chainId: cid }: { boardId: number; chainId: number }) => {
      const board = await db!.boards.where('[boardId+chainId]').equals([boardId, cid]).first()
      if (!board) throw new Error('Board not found')
      const newFavourite = board.favourite === 1 ? 0 : 1
      await db!.boards.where('[boardId+chainId]').equals([boardId, cid]).modify({ favourite: newFavourite })
      return { boardId, chainId: cid, favourite: newFavourite }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardsKey({ chainId: chainId! }) })
    },
  })

  return {
    boards,
    error,
    isLoading,
    toggleFavourite: favouriteMutation.mutate,
  }
}
