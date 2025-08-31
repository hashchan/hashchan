import {
  useState,
  useEffect,
  useCallback,
  useContext
} from 'react';

import {
  useContracts
} from '@/hooks/useContracts';

import {
  useAccount,
  usePublicClient,
  useBlockNumber
} from 'wagmi';
import { IDBContext } from '@/provider/IDBProvider';
import { useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query'


export const useBoard = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { boardId, chainId } = useParams();
  const { hashchan } = useContracts();
  const publicClient = usePublicClient();
  const blockNumber = useBlockNumber();

  const [board, setBoard] = useState(null);
  const { chain} = useAccount()
  const {db} = useContext(IDBContext)
  const queryClient = useQueryClient()

  const fetchBoard = useCallback(async () => {
    if (
      chain &&
      db &&
      boardId &&
      chainId &&
      publicClient &&
      hashchan
    ) {
      let board
      try {
        board = await db.boards
        .where('[boardId+chainId]')
        .equals([Number(boardId), Number(chainId)])
        .first()
      } catch (e) {
        console.log('db error, skipping')
      }

      if (!board) {
        const logs = await hashchan.getEvents.NewBoard(
          {
            boardId: boardId
          }
        )

        const log = logs[0]
        if (!log) {return}

        const { id, name, symbol } = log.args
        board = {
          boardId: Number(id),
          chainId: chain.id,
          favourite: 0,
          name,
          symbol,
          lastSynced: 0,
          metadata: {
            stats: {
              threadCount: 0,
              postCount: 0
            }
          }
        }

        try {
          await db.boards.add(board)
        } catch (e) {
          console.log('db error, skipping')
        }
      }
      setBoard(board)
    }

  }, [
    publicClient,
    chain,
    db,
    boardId,
    chainId,
    hashchan
  ]);


  const updateMetadataMutation = useMutation({
    mutationFn: async (increment: { threadCount?: number; postCount?: number }) => {
      if (!board) throw new Error('Board not loaded')
      
      await db.boards
        .where('[boardId+chainId]')
        .equals([board.boardId, board.chainId])
        .modify((boardData) => {
          if (!boardData.metadata) {
            boardData.metadata = { stats: { threadCount: 0, postCount: 0 } }
          }
          if (increment.threadCount) {
            boardData.metadata.stats.threadCount += increment.threadCount
          }
          if (increment.postCount) {
            boardData.metadata.stats.postCount += increment.postCount
          }
        })
      
      // Refresh board state from DB
      const updatedBoard = await db.boards
        .where('[boardId+chainId]')
        .equals([board.boardId, board.chainId])
        .first()
      
      return updatedBoard
    },
    onSuccess: (updatedBoard) => {
      if (updatedBoard) setBoard(updatedBoard)
      // Invalidate boards query to refresh UI with updated metadata
      queryClient.invalidateQueries({ queryKey: ['boards', Number(chain?.id)] })
    }
  })


  useEffect(() => {
    if (
      isInitialized ||
      !chain ||
      !db ||
      !boardId ||
      !chainId ||
      !publicClient ||
      !hashchan
    ) return

    const init = async () => {
      await fetchBoard()
      setIsInitialized(true)
    }

    init()

  },[
    isInitialized,
    chain,
    db,
    boardId,
    chainId,
    publicClient,
    hashchan,
    fetchBoard
  ])

  return {
    board,
    updateMetadata: updateMetadataMutation.mutate
  }
}
