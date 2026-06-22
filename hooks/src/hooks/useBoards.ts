import { useContext } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { useAccount, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'

export const useBoards = () => {
  const { address, chainId } = useAccount()
  const { db } = useContext(IDBContext)
  const blockNumber = useBlockNumber()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()

  const {
    data: boards = [],
    error,
    isLoading,
  } = useQuery({
    enabled: Boolean(address && chainId && db && blockNumber.data && hashchan),
    staleTime: 1000 * 60 * 5,
    queryKey: ['boards', Number(chainId)],
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
        const logs = await hashchan.getEvents.NewBoard({ boardId: BigInt(i) })
        if (!logs[0]) continue
        const { id, name, symbol, description, bannerUrl, bannerCID, rules } = logs[0].args
        const newBoard = {
          boardId: Number(id),
          chainId: chainId!,
          name,
          symbol,
          description,
          bannerUrl,
          bannerCID,
          rules,
          lastSynced: 0,
          favourite: 0,
          metadata: { stats: { threadCount: 0, postCount: 0 } },
        }
        try {
          await db!.boards.add(newBoard)
          boards.push(newBoard as any)
        } catch (e) {
          console.log('board already exists, skipping')
        }
      }

      await db!.boardsSync.where('chainId').equals(chainId!).modify({
        boardIterator: endId,
        lastSynced: Number(blockNumber.data),
      })

      return boards
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
      queryClient.invalidateQueries({ queryKey: ['boards', Number(chainId)] })
    },
  })

  return {
    boards,
    error,
    isLoading,
    toggleFavourite: favouriteMutation.mutate,
  }
}
