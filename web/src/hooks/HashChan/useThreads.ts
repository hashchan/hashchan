import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'
import { useContracts } from '@/hooks/useContracts'
import { IDBContext } from '@/provider/IDBProvider'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { useParams } from 'react-router-dom'
import { tryRecurseBlockFilter } from '@/utils/blockchain'

interface Thread {
  lastSynced: number
  boardId: number
  threadId: string
  creator: string
  imgUrl: string
  imgCID: string
  title: string
  content: string
  janitoredBy: string[]
  chainId: number
  timestamp: number
}

const createQueryKey = (boardId: string | undefined, chainId: string | undefined, blockNumber: bigint | undefined) => {
  return ['threads', boardId, chainId, blockNumber ? Number(blockNumber) : undefined] as const
}

export const useThreads = () => {
  const { board } = useBoard()
  const { boardId: boardIdParam, chainId: chainIdParam } = useParams()
  const { db } = useContext(IDBContext)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient()
  const blockNumber = useBlockNumber()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const unwatchRef = useRef<(() => void) | null>(null)

  const {
    data: threads = [],
    error,
    isLoading,
    isReducedMode
  } = useQuery({
    queryKey: createQueryKey(boardIdParam, chainIdParam, blockNumber.data),
    queryFn: async () => {
      // Get cached threads
      let threads = await db.threads
        .where(['boardId+chainId'])
        .equals([Number(boardIdParam), Number(chainIdParam)])
        .toArray()

      threads = await Promise.all(
        threads.map(async (thread) => ({
          ...thread,
          janitoredBy: []
        }))
      )

      // Check if we need to sync with blockchain
      if (blockNumber.data > board.lastSynced) {
        const startingFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: {
            'boardId': `0x${BigInt(board.boardId).toString(16)}`
          },
          fromBlock: BigInt(board.lastSynced ? board.lastSynced : 0),
          toBlock: blockNumber.data
        }

        const { filter, isReduced } = await tryRecurseBlockFilter(publicClient, startingFilterArgs)

        try {
          const logs = await publicClient.getFilterLogs({ filter })
          
          for (const log of logs) {
            const newThread: Thread = {
              lastSynced: 0,
              boardId: Number(log.args.boardId),
              threadId: log.args.threadId,
              creator: log.args.creator,
              imgUrl: log.args.imgUrl,
              imgCID: log.args.imgCID,
              title: log.args.title,
              content: log.args.content,
              janitoredBy: [],
              chainId: Number(chain.id),
              timestamp: Number(log.args.timestamp)
            }

            try {
              await db.threads.add(newThread)
              threads.push(newThread)
            } catch (e) {
              console.log('Duplicate thread, skipping')
            }
          }

          // Update board's last synced timestamp
          await db.boards
            .where('[boardId+chainId]')
            .equals([Number(boardIdParam), Number(chainIdParam)])
            .modify({ lastSynced: Number(blockNumber.data) })

          return threads
        } catch (error) {
          console.error('Filter error:', error)
          throw error
        }
      }

      return threads
    },
    enabled: Boolean(
      publicClient &&
      address &&
      db &&
      blockNumber.data &&
      hashchan &&
      board &&
      chain?.id &&
      boardIdParam &&
      chainIdParam
    ),
    staleTime: 1000 * 30, // 30 seconds
  })

  // Set up real-time updates
  useEffect(() => {
    if (!hashchan || !board || !chain?.id) return

    const unwatch = publicClient.watchContractEvent({
      address: hashchan.address,
      abi: hashchan.abi,
      eventName: 'NewThread',
      args: {
        boardId: board.boardId
      },
      onLogs: async (logs) => {
        const newThread = {
          title: logs[0].args.title,
          creator: logs[0].args.creator,
          threadId: logs[0].args.threadId,
          imgUrl: logs[0].args.imgUrl,
          imgCID: logs[0].args.imgCID,
          content: logs[0].args.content,
          janitoredBy: [],
          chainId: chain.id,
          timestamp: Number(logs[0].args.timestamp)
        }

        // Update IndexedDB
        try {
          await db.threads.add(newThread)
        } catch (e) {
          console.log('Duplicate thread, skipping')
        }

        // Update query cache
        queryClient.setQueryData(
          createQueryKey(boardIdParam, chainIdParam, blockNumber.data),
          (old: Thread[] = []) => [...old, newThread]
        )
      }
    })

    unwatchRef.current = unwatch

    return () => {
      if (unwatchRef.current) {
        unwatchRef.current()
        unwatchRef.current = null
      }
    }
  }, [hashchan, board?.boardId, chain?.id])

  // Reset query when board changes
  useEffect(() => {
    queryClient.resetQueries(createQueryKey(boardIdParam, chainIdParam, blockNumber.data))
  }, [boardIdParam, chainIdParam])

  return {
    threads,
    error,
    isLoading,
    isReducedMode,
    refetch: () => queryClient.invalidateQueries(createQueryKey(boardIdParam, chainIdParam, blockNumber.data))
  }
}
