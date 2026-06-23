import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { tryRecurseBlockFilter } from '../utils/blockchain'
import type { Thread } from '../provider/IDBProvider'
import { type NewThreadArgs, type FilterLog } from '../types/events'

const createQueryKey = (boardId: number, chainId: number, blockNumber: bigint | undefined) =>
  ['threads', boardId, chainId, blockNumber ? Number(blockNumber) : undefined] as const

export const useThreads = (boardId: number, chainId: number) => {
  const { board, updateMetadata } = useBoard(boardId, chainId)
  const { db } = useContext(IDBContext)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient()
  const blockNumber = useBlockNumber()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const unwatchRef = useRef<(() => void) | null>(null)

  const { data: threads = [], error, isLoading } = useQuery({
    queryKey: createQueryKey(boardId, chainId, blockNumber.data),
    enabled: Boolean(
      publicClient && address && db && blockNumber.data && hashchan && board && chain?.id
    ),
    staleTime: 1000 * 30,
    queryFn: async () => {
      let threads = await db!.threads
        .where(['boardId+chainId'])
        .equals([boardId, chainId])
        .toArray()

      if (blockNumber.data! > BigInt(board!.lastSynced)) {
        const startingFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { boardId: `0x${BigInt(board!.boardId).toString(16)}` },
          fromBlock: BigInt(board!.lastSynced || 0),
          toBlock: blockNumber.data,
        }

        const { filter } = await tryRecurseBlockFilter(publicClient!, startingFilterArgs)
        const logs = await publicClient!.getFilterLogs({ filter })

        for (const log of logs) {
          const logArgs = (log as unknown as FilterLog<NewThreadArgs>).args
          const existing = await db!.threads.where('threadId').equals(logArgs.threadId).first()
          if (existing) continue

          const newThread: Thread = {
            lastSynced: 0,
            boardId: Number(logArgs.boardId),
            threadId: logArgs.threadId,
            creator: logArgs.creator,
            imgUrl: logArgs.imgUrl,
            imgCID: logArgs.imgCID,
            title: logArgs.title,
            bookmarked: 0,
            content: logArgs.content,
            chainId: chain!.id,
            timestamp: Number(logArgs.timestamp),
          }

          try {
            await db!.threads.add(newThread)
            threads.push(newThread)
          } catch (e) {
            console.log('Skipping duplicate thread:', newThread.threadId)
          }
        }

        await db!.boards
          .where('[boardId+chainId]')
          .equals([boardId, chainId])
          .modify({ lastSynced: Number(blockNumber.data) })

        if (logs.length > 0) updateMetadata({ threadCount: logs.length })
      }

      return threads
    },
  })

  useEffect(() => {
    if (!hashchan || !board || !chain?.id || !publicClient) return

    const unwatch = publicClient.watchContractEvent({
      address: hashchan.address,
      abi: hashchan.abi,
      eventName: 'NewThread',
      args: { boardId: board.boardId },
      onLogs: async (logs: any[]) => {
        const logArgs = logs[0].args
        const existing = await db!.threads.where('threadId').equals(logArgs.threadId).first()
        if (existing) return

        const newThread = {
          lastSynced: 0,
          boardId: Number(logArgs.boardId),
          title: logArgs.title,
          creator: logArgs.creator,
          threadId: logArgs.threadId,
          imgUrl: logArgs.imgUrl,
          imgCID: logArgs.imgCID,
          content: logArgs.content,
          bookmarked: 0,
          chainId: chain!.id,
          timestamp: Number(logArgs.timestamp),
        }

        try {
          await db!.threads.add(newThread)
          updateMetadata({ threadCount: 1 })
        } catch (e) {
          console.log('Skipping duplicate thread:', newThread.threadId)
        }

        queryClient.setQueryData(
          createQueryKey(boardId, chainId, blockNumber.data),
          (old: Thread[] = []) => [...old, newThread]
        )
      },
    })

    unwatchRef.current = unwatch
    return () => {
      unwatchRef.current?.()
      unwatchRef.current = null
    }
  }, [hashchan, board?.boardId, chain?.id])

  useEffect(() => {
    queryClient.resetQueries({ queryKey: createQueryKey(boardId, chainId, blockNumber.data) })
  }, [boardId, chainId])

  return {
    threads,
    error,
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey: createQueryKey(boardId, chainId, blockNumber.data) }),
  }
}
