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
  bookmarked: boolean
  janitoredBy: string[]
  chainId: number
  timestamp: number
}

const createQueryKey = (boardId: string | undefined, chainId: string | undefined, blockNumber: bigint | undefined) => {
  return ['threads', boardId, chainId, blockNumber ? Number(blockNumber) : undefined] as const
}

export const useThreads = () => {
  const { board, updateMetadata } = useBoard()
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
            // Type cast the log to access args properly
            const logArgs = (log as any).args
            
            // Check if thread already exists
            const existingThread = await db.threads.where('threadId').equals(logArgs.threadId).first()
            
            if (existingThread) {
              console.log('Thread already exists, skipping:', logArgs.threadId)
              continue
            }

            const newThread: Thread = {
              lastSynced: 0,
              boardId: Number(logArgs.boardId),
              threadId: logArgs.threadId,
              creator: logArgs.creator,
              imgUrl: logArgs.imgUrl,
              imgCID: logArgs.imgCID,
              title: logArgs.title,
              bookmarked: false,
              content: logArgs.content,
              janitoredBy: [],
              chainId: Number(chain.id),
              timestamp: Number(logArgs.timestamp)
            }

            try {
              console.log('Adding new thread:', newThread.threadId)
              await db.threads.add(newThread)
              threads.push(newThread)
            } catch (e) {
              console.log('Error adding thread:', e)
              console.log('Skipping thread:', newThread.threadId)
            }
          }

          // Update board's last synced timestamp
          await db.boards
            .where('[boardId+chainId]')
            .equals([Number(boardIdParam), Number(chainIdParam)])
            .modify({ lastSynced: Number(blockNumber.data) })

          // Update thread count using the mutation
          if (logs.length > 0) {
            updateMetadata({ threadCount: logs.length })
          }

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

    console.log(`🔍 Starting event watcher for NewThread events on board ${board.boardId}...`)
    
    const unwatch = publicClient.watchContractEvent({
      address: hashchan.address,
      abi: hashchan.abi,
      eventName: 'NewThread',
      args: {
        boardId: board.boardId
      },
      onLogs: async (logs) => {
        console.log(`📡 Received ${logs.length} new thread event(s) via polling`)
        console.log('logs', logs)
        
        const logArgs = (logs[0] as any).args
        
        // Check if thread already exists
        const existingThread = await db.threads.where('threadId').equals(logArgs.threadId).first()
        
        if (existingThread) {
          console.log('Thread already exists in real-time update, skipping:', logArgs.threadId)
          return
        }
        
        const newThread = {
          lastSynced: 0,
          boardId: Number(logArgs.boardId),
          title: logArgs.title,
          creator: logArgs.creator,
          threadId: logArgs.threadId,
          imgUrl: logArgs.imgUrl,
          imgCID: logArgs.imgCID,
          content: logArgs.content,
          bookmarked: false,
          janitoredBy: [],
          chainId: Number(chain.id),
          timestamp: Number(logArgs.timestamp)
        }

        console.log('new thread', newThread)

        // Update IndexedDB
        try {
          await db.threads.add(newThread)
          updateMetadata({ threadCount: 1 })
          console.log('Thread added to IndexedDB')
        } catch (e) {
          console.log('Error adding thread in real-time:', e)
          console.log('Skipping thread:', newThread.threadId)
        }

        // Update query cache
        queryClient.setQueryData(
          createQueryKey(boardIdParam, chainIdParam, blockNumber.data),
          (old: Thread[] = []) => [...old, newThread]
        )
        console.log('Thread added to query cache')
      }
    })

    unwatchRef.current = unwatch

    return () => {
      if (unwatchRef.current) {
        console.log(`🛑 Stopping event watcher for board ${board?.boardId}`)
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
