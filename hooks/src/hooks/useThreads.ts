import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useHookSettings } from './useHookSettings'
import { chunkedFetchLogs, fetchAllLogs, clampFromBlock } from '../utils/blockchain'
import { useEnabled } from '../utils/enabled'
import type { Thread } from '../provider/IDBProvider'
import { type NewThreadArgs, type FilterLog } from '../types/events'
import { threadsKey, boardKey } from '../utils/queryKeys'

export const useThreads = (boardId: number, chainId: number) => {
  const { board, updateMetadata } = useBoard(boardId, chainId)
  const { db, sanitize } = useContext(IDBContext)
  const { address, chain } = useConnection()
  const publicClient = usePublicClient()
  const blockNumber = useBlockNumber()
  const { hashchan, hashchanDeployedAtBlock } = useContracts()
  const queryClient = useQueryClient()
  const { hookSettings } = useHookSettings()
  const unwatchRef = useRef<(() => void) | null>(null)

  const strategy = hookSettings?.indexingStrategy
  const blockRangeLimit = hookSettings ? BigInt(hookSettings.blockRangeLimit) : 0n
  const enabled = useEnabled({ publicClient, address, db, hashchan, board, chainId: chain?.id, hookSettings, hashchanDeployedAtBlock })

  // bottom of the scanned interval — null means no history fetched yet
  const [historyBoundary, setHistoryBoundary] = useState<bigint | null>(null)

  useEffect(() => {
    if (!db) return
    db.boards.where('[boardId+chainId]').equals([boardId, chainId]).first().then((b) => {
      setHistoryBoundary(b?.scanBoundary != null ? BigInt(b.scanBoundary) : null)
    })
  }, [boardId, chainId, db])

  const { data: threads = [], error, isLoading } = useQuery({
    queryKey: threadsKey({ chainId, boardId }),
    enabled,
    staleTime: 1000 * 30,
    queryFn: async () => {
      let threads = await db!.threads
        .where(['boardId+chainId'])
        .equals([boardId, chainId])
        .toArray()

      // Snapshot the chain head once per fetch rather than reading the
      // reactively-updating useBlockNumber() value, so this doesn't re-run
      // just because blockNumber ticked elsewhere in the app.
      const toBlock = await publicClient!.getBlockNumber()

      // The scanned interval's high-water mark (board.lastSynced) is shared by
      // both strategies. reverseChunked's first-ever sync seeds an initial
      // recent window instead of scanning all history; every later run for
      // either strategy just bridges from lastSynced to the current tip —
      // however large that gap is. fullNode/bulkScrape fetch that whole gap
      // in one unbounded call (no chunking — see fetchAllLogs); only
      // reverseChunked paces it in blockRangeLimit-sized windows.
      // board.blockCreatedAt (captured for free from the NewBoard log's own
      // blockNumber once known) is a tighter floor than the contract's
      // deployment block — a board's threads can't exist before the board
      // itself did, so prefer it over hashchanDeployedAtBlock wherever known.
      const boardFloor = board!.blockCreatedAt != null ? BigInt(board!.blockCreatedAt) : hashchanDeployedAtBlock!
      const isFirstSync = !board!.lastSynced
      const fromBlock = strategy === 'reverseChunked' && isFirstSync
        ? clampFromBlock(toBlock - blockRangeLimit, boardFloor)
        : BigInt(board!.lastSynced || boardFloor)

      if (toBlock > fromBlock) {
        const filterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { boardId: `0x${BigInt(board!.boardId).toString(16)}` },
          fromBlock,
          toBlock,
        }
        const logs = strategy === 'reverseChunked'
          ? await chunkedFetchLogs(publicClient!, filterArgs, blockRangeLimit)
          : await fetchAllLogs(publicClient!, filterArgs)

        // Counts only threads actually newly persisted, not raw fetched logs —
        // a log can be legitimately re-fetched (e.g. the live watcher below
        // already caught it) and correctly no-op as a duplicate here, but that
        // must not also increment the board's threadCount a second time.
        let newThreadCount = 0
        for (const log of logs) {
          const logArgs = (log as unknown as FilterLog<NewThreadArgs>).args
          const existing = await db!.threads.where('threadId').equals(logArgs.threadId).first()
          if (existing) continue

          const newThread: Thread = {
            lastSynced: 0,
            blockCreatedAt: Number((log as unknown as FilterLog<NewThreadArgs>).blockNumber),
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
            newThreadCount++
          } catch (e) {
            console.log('Skipping duplicate thread:', newThread.threadId)
          }
        }

        const boardUpdate: { lastSynced: number; scanBoundary?: number } = { lastSynced: Number(toBlock) }
        if (strategy === 'reverseChunked' && isFirstSync) {
          boardUpdate.scanBoundary = Number(fromBlock)
          setHistoryBoundary(fromBlock)
        }
        await db!.boards
          .where('[boardId+chainId]')
          .equals([boardId, chainId])
          .modify(boardUpdate)

        // useBoard()'s cached board object won't see the write above on its
        // own — without this, isFirstSync reads a permanently-stale
        // board.lastSynced on every future run, so this branch keeps
        // re-triggering and clobbering fetchHistory's deeper scanBoundary
        // back up to a fresh shallow window every time.
        queryClient.setQueryData(
          boardKey({ chainId, boardId }),
          (old: typeof board) => old ? { ...old, ...boardUpdate } : old
        )

        if (newThreadCount > 0) updateMetadata({ threadCount: newThreadCount })
      }

      return threads.map(t => ({ ...t, title: sanitize(t.title), content: sanitize(t.content) }))
    },
  })

  // Explore one block range further back in history, appending any found threads to IDB.
  // historyBoundary tracks where the last fetch ended so ranges are always contiguous,
  // independent of the automatic forward catch-up above.
  const fetchHistory = useCallback(async () => {
    if (!publicClient || !hashchan || !db || !board || hashchanDeployedAtBlock == null || blockRangeLimit === 0n) return

    // Prefer the board's own creation block over the contract's deployment
    // block where known — there's nothing to find scanning further back than
    // when this specific board was created.
    const boardFloor = board.blockCreatedAt != null ? BigInt(board.blockCreatedAt) : hashchanDeployedAtBlock

    const head = await publicClient.getBlockNumber()
    const toBlock = historyBoundary ?? clampFromBlock(head - blockRangeLimit, boardFloor)
    if (toBlock <= boardFloor) return
    const fromBlock = clampFromBlock(toBlock - blockRangeLimit, boardFloor)

    try {
      const logs = await chunkedFetchLogs(publicClient, {
        address: hashchan.address,
        abi: hashchan.abi,
        eventName: 'NewThread',
        args: { boardId: `0x${BigInt(board.boardId).toString(16)}` },
        fromBlock,
        toBlock,
      }, blockRangeLimit)

      let newThreadCount = 0
      for (const log of logs) {
        const logArgs = (log as unknown as FilterLog<NewThreadArgs>).args
        try {
          await db.threads.add({
            lastSynced: 0,
            blockCreatedAt: Number((log as unknown as FilterLog<NewThreadArgs>).blockNumber),
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
          newThreadCount++
        } catch {
          // duplicate, skip
        }
      }

      if (newThreadCount > 0) updateMetadata({ threadCount: newThreadCount })
      setHistoryBoundary(fromBlock)
      await db.boards.where('[boardId+chainId]').equals([boardId, chainId]).modify({ scanBoundary: Number(fromBlock) })
      queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId }) })
    } catch (e) {
      console.log('Failed to fetch thread history:', e)
    }
  }, [historyBoundary, blockRangeLimit, publicClient, hashchan, hashchanDeployedAtBlock, db, board, chain, chainId, boardId, queryClient, updateMetadata])

  const historyFloor = board?.blockCreatedAt != null ? BigInt(board.blockCreatedAt) : hashchanDeployedAtBlock
  const canFetchHistory = strategy === 'reverseChunked'
    && (historyBoundary === null || (historyFloor != null && historyBoundary > historyFloor))

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
          blockCreatedAt: Number(logs[0].blockNumber),
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

        let inserted = true
        try {
          await db!.threads.add(newThread)
          updateMetadata({ threadCount: 1 })
        } catch (e) {
          inserted = false
          console.log('Skipping duplicate thread:', newThread.threadId)
        }

        // Same race as useThread.ts's NewPost watcher: a queryFn refetch can
        // independently pick up this same event first, so only append to the
        // cache if this handler is the one that actually inserted it.
        if (inserted) {
          queryClient.setQueryData(
            threadsKey({ chainId, boardId }),
            (old: Thread[] = []) => [...old, { ...newThread, title: sanitize(newThread.title), content: sanitize(newThread.content) }]
          )
        }
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
    historyBoundary,
    blockNumber: blockNumber.data,
    refetch: () => queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId }) }),
  }
}
