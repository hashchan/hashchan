import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useSettings } from './useSettings'
import { tryRecurseBlockFilter } from '../utils/blockchain'
import { useEnabled } from '../utils/enabled'
import type { Thread } from '../provider/IDBProvider'
import { type NewThreadArgs, type FilterLog } from '../types/events'
import { threadsKey } from '../utils/queryKeys'

export const useThreads = (boardId: number, chainId: number) => {
  const { board, updateMetadata } = useBoard(boardId, chainId)
  const { db, sanitize } = useContext(IDBContext)
  const { address, chain } = useConnection()
  const publicClient = usePublicClient()
  const blockNumber = useBlockNumber()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const { settings } = useSettings()
  const unwatchRef = useRef<(() => void) | null>(null)

  const strategy = settings?.indexingStrategy
  const blockRangeLimit = settings ? BigInt(settings.blockRangeLimit) : 0n
  const enabled = useEnabled({ publicClient, address, db, blockNumber: blockNumber.data, hashchan, board, chainId: chain?.id, settings })

  // bottom of the last explored historical range — null means no history fetched yet
  const [historyBoundary, setHistoryBoundary] = useState<bigint | null>(null)

  useEffect(() => {
    setHistoryBoundary(null)
  }, [boardId, chainId])

  const { data: threads = [], error, isLoading } = useQuery({
    queryKey: threadsKey({ chainId, boardId, blockNumber: blockNumber.data }),
    enabled,
    staleTime: 1000 * 30,
    queryFn: async () => {
      let threads = await db!.threads
        .where(['boardId+chainId'])
        .equals([boardId, chainId])
        .toArray()

      const fromBlock = strategy === 'reverseChunked'
        ? (blockNumber.data! > blockRangeLimit ? blockNumber.data! - blockRangeLimit : 0n)
        : BigInt(board!.lastSynced || 0)
      const toBlock = blockNumber.data!

      if (toBlock > BigInt(board!.lastSynced) || strategy === 'reverseChunked') {
        const startingFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { boardId: `0x${BigInt(board!.boardId).toString(16)}` },
          fromBlock,
          toBlock,
        }

        let logs: any[]
        if (strategy === 'reverseChunked') {
          const filter: any = await publicClient!.createContractEventFilter(startingFilterArgs)
          logs = await publicClient!.getFilterLogs({ filter })
        } else {
          const { filter } = await tryRecurseBlockFilter(publicClient!, startingFilterArgs)
          logs = await publicClient!.getFilterLogs({ filter })
        }

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

        if (strategy !== 'reverseChunked') {
          await db!.boards
            .where('[boardId+chainId]')
            .equals([boardId, chainId])
            .modify({ lastSynced: Number(toBlock) })
        }

        if (logs.length > 0) updateMetadata({ threadCount: logs.length })
      }

      return threads.map(t => ({ ...t, title: sanitize(t.title), content: sanitize(t.content) }))
    },
  })

  // Explore one block range further back in history, appending any found threads to IDB.
  // historyBoundary tracks where the last fetch ended so ranges are always contiguous,
  // regardless of where blockNumber.data is at call time.
  const fetchHistory = useCallback(async () => {
    if (!blockNumber.data || !publicClient || !hashchan || !db || !board || blockRangeLimit === 0n) return

    const toBlock = historyBoundary ?? (blockNumber.data > blockRangeLimit ? blockNumber.data - blockRangeLimit : 0n)
    if (toBlock === 0n) return
    const fromBlock = toBlock > blockRangeLimit ? toBlock - blockRangeLimit : 0n

    try {
      const filter: any = await publicClient.createContractEventFilter({
        address: hashchan.address,
        abi: hashchan.abi,
        eventName: 'NewThread',
        args: { boardId: `0x${BigInt(board.boardId).toString(16)}` },
        fromBlock,
        toBlock,
      })
      const logs = await publicClient.getFilterLogs({ filter })

      for (const log of logs) {
        const logArgs = (log as unknown as FilterLog<NewThreadArgs>).args
        try {
          await db.threads.add({
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
          })
        } catch {
          // duplicate, skip
        }
      }

      if (logs.length > 0) updateMetadata({ threadCount: logs.length })
      setHistoryBoundary(fromBlock)
      queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId, blockNumber: blockNumber.data }) })
    } catch (e) {
      console.log('Failed to fetch thread history:', e)
    }
  }, [historyBoundary, blockNumber.data, blockRangeLimit, publicClient, hashchan, db, board, chain, chainId, boardId, queryClient, updateMetadata])

  const canFetchHistory = strategy === 'reverseChunked'
    && !!blockNumber.data
    && (historyBoundary === null || historyBoundary > 0n)

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
          threadsKey({ chainId, boardId, blockNumber: blockNumber.data }),
          (old: Thread[] = []) => [...old, { ...newThread, title: sanitize(newThread.title), content: sanitize(newThread.content) }]
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
    queryClient.resetQueries({ queryKey: ['threads', chainId, boardId] })
  }, [boardId, chainId])

  return {
    threads,
    error,
    isLoading,
    strategy,
    fetchHistory,
    canFetchHistory,
    refetch: () => queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId, blockNumber: blockNumber.data }) }),
  }
}
