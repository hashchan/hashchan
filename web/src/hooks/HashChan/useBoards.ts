import { useContext } from 'react'
import { useQuery, useQueryClient, useMutation  } from '@tanstack/react-query'

import { useConnection, useAccount, useBlockNumber} from 'wagmi'

import { IDBContext  } from '@/provider/IDBProvider'
import { useContracts } from '@/hooks/useContracts'

interface Board {
  id?: number
  boardId: number
  chainId: number
  favourite: number
  name: string
  symbol: string
  description: string
  bannerUrl: string
  bannerCID: string
  rules: string[]
  lastSynced: number
}

/*
interface BoardDependencies {
  address: `0x${string}`;
  chainId: bigint;
  db: object;
  blockNumber: bigint;
  hashchan: object;
}
*/



export const useBoards = () => {
  const { address, chainId } = useConnection()
  //const { address, chain } =  useAccount()
  const { db } = useContext(IDBContext)
  const blockNumber = useBlockNumber();
  const { hashchan } = useContracts();

  const queryClient = useQueryClient()


  const {
    data: boards = [],
    error,
    isLoading,
  } = useQuery({
    enabled: Boolean(
      address &&
      chainId &&
      db &&
      blockNumber.data &&
      hashchan
    ),
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
    queryKey: ['boards', Number(chainId)],
    queryFn: async () => {
      console.log('fetching boards')
      let boardsSync = await db.boardsSync.where('chainId').equals(chainId).first()
      if (!boardsSync) {
        boardsSync = {
          chainId: chainId,
          lastSynced: 0,
          boardIterator: 0
        }
        await db.boardsSync.add(boardsSync)
      }
      // get cached boards
      const boards = await db.boards.where('chainId').equals(chainId).toArray()
      console.log('trying to fetch board count')
      const boardCount = await hashchan.read.boardCount()
      console.log('boardCount', boardCount)

      // get new boards
      //
      for (let i = boards.length; i < boardCount; i++) {
        const ethBoard = await hashchan.read.getBoard([i])
        // in case of bad cache
        const exist = await db.boards.where('[boardId+chainId]').equals([i, chainId]).first()
        if (!exist) {
          const board = {
            boardId: Number(i),
            chainId: chainId,
            favourite: 0,
            name: ethBoard.name,
            symbol: ethBoard.symbol,
            description: ethBoard.description,
            bannerUrl: ethBoard.bannerUrl,
            bannerCID: ethBoard.bannerCID,
            rules: ethBoard.rules,
            lastSynced: 0,
            metadata: {
              stats: {
                threadCount: 0,
                postCount: 0
              }
            }
          }
          await db.boards.add(board)
          boards.push(board)
        }
      }
      // update sync status
      await db.boardsSync.where('chainId').equals(chainId).modify({
        lastSynced: Number(blockNumber.data),
        boardIterator: Number(boardCount)
      })
      return boards
    }
  })

  const {
    data: favouriteBoards = []
  } = useQuery({
    enabled: Boolean(
      address &&
      chainId &&
      db
    ),
    queryKey: ['favouriteBoards', Number(chainId)],
    queryFn: async () => {
      return db.boards
        .where('[chainId+favourite]')
        .equals([chainId, 1])
        .toArray()
    }
  })


  const toggleFavouriteMutation = useMutation({
    mutationFn: async (board: Board) => {
      await db.boards
        .where('[boardId+chainId]')
        .equals([board.boardId, board.chainId])
        .modify({ favourite: board.favourite === 1 ? 0 : 1 })
      return board
    },
    onSuccess: () => {
      // Invalidate both queries to ensure UI updates
      queryClient.invalidateQueries({ queryKey: ['boards', Number(chainId)] })
      queryClient.invalidateQueries({ queryKey: ['favouriteBoards', Number(chainId)] })
    }
  })

  return {
    boards,
    error,
    isLoading,
    favouriteBoards,
    toggleFavourite: toggleFavouriteMutation.mutate,
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: ['boards', Number(chainId)] })
      queryClient.invalidateQueries({ queryKey: ['favouriteBoards', Number(chainId)] })
    }
  }
}
