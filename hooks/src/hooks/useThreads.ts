import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useContext, useEffect, useRef, useState, useCallback } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useHookSettings } from './useHookSettings'
import { chunkedFetchLogs, fetchAllLogs, clampFromBlock } from '../utils/blockchain'
import { mergeSpan, liveSpan, earliestSpan, spanNear, type Span } from '../utils/spans'
import { useEnabled } from '../utils/enabled'
import type { Thread } from '../provider/IDBProvider'
import { type NewThreadArgs, type FilterLog } from '../types/events'
import { threadsKey, boardKey } from '../utils/queryKeys'

export const useThreads = (boardId: number, chainId: number, atBlock?: bigint) => {
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

  // Sparse set of block ranges already known to be fully scanned for this
  // board's NewThread events — see utils/spans.ts. Loaded from Dexie on
  // mount, and kept in sync (not authoritative — see scanRange/fetchHistory/
  // fetchForwardHistory, which always re-read fresh from Dexie) after any
  // action that persists a new one.
  const [scannedSpans, setScannedSpans] = useState<Span[]>([])

  useEffect(() => {
    if (!db) return
    db.boards.where('[boardId+chainId]').equals([boardId, chainId]).first().then((b) => {
      setScannedSpans(b?.scannedSpans ?? [])
    })
  }, [boardId, chainId, db, atBlock])

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

      // board.blockCreatedAt (captured for free from the NewBoard log's own
      // blockNumber once known) is a tighter floor than the contract's
      // deployment block — a board's threads can't exist before the board
      // itself did, so prefer it over hashchanDeployedAtBlock wherever known.
      const boardFloor = board!.blockCreatedAt != null ? BigInt(board!.blockCreatedAt) : hashchanDeployedAtBlock!

      // liveSpan is the region tip-tailing sync keeps extending every run —
      // bridge from wherever it currently ends, however large that gap is.
      // reverseChunked's very first run (no spans at all yet) seeds a
      // shallow recent window instead of scanning all history;
      // fullNode/bulkScrape fetch that whole gap in one unbounded call (no
      // chunking — see fetchAllLogs); only reverseChunked paces it in
      // blockRangeLimit-sized windows.
      let boardSpans: Span[] = board!.scannedSpans ?? []
      const live = liveSpan(boardSpans)
      const fromBlock = live
        ? BigInt(live.toBlock) + 1n
        : strategy === 'reverseChunked'
          ? clampFromBlock(toBlock - blockRangeLimit, boardFloor)
          : boardFloor

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
            scannedSpans: [],
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

        boardSpans = mergeSpan(boardSpans, { fromBlock: Number(live?.fromBlock ?? fromBlock), toBlock: Number(toBlock) })
        const boardUpdate = { scannedSpans: boardSpans, lastSynced: liveSpan(boardSpans)?.toBlock ?? 0 }
        await db!.boards
          .where('[boardId+chainId]')
          .equals([boardId, chainId])
          .modify(boardUpdate)
        setScannedSpans(boardSpans)

        // useBoard()'s cached board object won't see the write above on its
        // own — without this, the liveSpan read above keeps seeing a stale
        // scannedSpans on every future run, so this branch keeps re-triggering
        // and clobbering fetchHistory's/fetchForwardHistory's deeper progress
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

  // The one place raw logs get fetched and turned into persisted threads
  // plus an updated span, for any caller (fetchHistory, fetchForwardHistory,
  // or a scan-map UI clicking an arbitrary cell) that already knows exactly
  // which [fromBlock, toBlock] window it wants. Always re-reads scannedSpans
  // fresh from Dexie rather than trusting the scannedSpans React state,
  // which can be one render behind the live queryFn's own writes.
  const scanRange = useCallback(async (fromBlock: bigint, toBlock: bigint) => {
    if (!publicClient || !hashchan || !db || !board || blockRangeLimit === 0n || toBlock < fromBlock) return
    const cachedBoard = await db.boards.where('[boardId+chainId]').equals([boardId, chainId]).first()
    const spans = cachedBoard?.scannedSpans ?? []

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
            scannedSpans: [],
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
      const newSpans = mergeSpan(spans, { fromBlock: Number(fromBlock), toBlock: Number(toBlock) })
      await db.boards.where('[boardId+chainId]').equals([boardId, chainId]).modify({
        scannedSpans: newSpans,
        lastSynced: liveSpan(newSpans)?.toBlock ?? 0,
      })
      setScannedSpans(newSpans)
      queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId }) })
    } catch (e) {
      console.log('[useThreads] scanRange error:', e)
    }
  }, [blockRangeLimit, publicClient, hashchan, db, board, chain, chainId, boardId, queryClient, updateMetadata])

  // Extend the earliest known span one blockRangeLimit window further back —
  // the existing manual "scan backwards" action.
  const fetchHistory = useCallback(async () => {
    if (!publicClient || !hashchan || !db || !board || hashchanDeployedAtBlock == null || blockRangeLimit === 0n) return

    // Prefer the board's own creation block over the contract's deployment
    // block where known — there's nothing to find scanning further back than
    // when this specific board was created.
    const boardFloor = board.blockCreatedAt != null ? BigInt(board.blockCreatedAt) : hashchanDeployedAtBlock
    const cachedBoard = await db.boards.where('[boardId+chainId]').equals([boardId, chainId]).first()
    const spans = cachedBoard?.scannedSpans ?? []
    const earliest = earliestSpan(spans)

    const head = await publicClient.getBlockNumber()
    const toBlock = earliest ? BigInt(earliest.fromBlock) - 1n : clampFromBlock(head - blockRangeLimit, boardFloor)
    if (toBlock <= boardFloor) return
    const fromBlock = clampFromBlock(toBlock - blockRangeLimit + 1n, boardFloor)

    await scanRange(fromBlock, toBlock)
  }, [scanRange, publicClient, hashchan, db, board, hashchanDeployedAtBlock, blockRangeLimit, boardId, chainId])

  // Extend the atBlock-anchored span one blockRangeLimit window forward,
  // toward wherever the live/tip-tailed span currently starts. Once the two
  // meet, mergeSpan coalesces them and this naturally has nothing left to do.
  const fetchForwardHistory = useCallback(async () => {
    if (!publicClient || !db || atBlock == null || blockRangeLimit === 0n) return

    const cachedBoard = await db.boards.where('[boardId+chainId]').equals([boardId, chainId]).first()
    const spans = cachedBoard?.scannedSpans ?? []
    const live = liveSpan(spans)
    const existing = spanNear(spans, Number(atBlock))
    if (existing && existing === live) return // already merged

    const tip = await publicClient.getBlockNumber()
    const fromBlock = existing ? BigInt(existing.toBlock) + 1n : atBlock
    const cappedTo = live ? BigInt(live.fromBlock) - 1n : tip
    const windowEnd = fromBlock + blockRangeLimit - 1n
    const toBlock = [windowEnd, cappedTo, tip].reduce((a, b) => (b < a ? b : a))
    if (toBlock < fromBlock) return

    await scanRange(fromBlock, toBlock)
  }, [scanRange, atBlock, publicClient, db, blockRangeLimit, boardId, chainId])

  const historyFloor = board?.blockCreatedAt != null ? BigInt(board.blockCreatedAt) : hashchanDeployedAtBlock
  const earliest = earliestSpan(scannedSpans)
  const historyBoundary = earliest ? BigInt(earliest.fromBlock) : null
  const canFetchHistory = strategy === 'reverseChunked'
    && (earliest === undefined || (historyFloor != null && BigInt(earliest.fromBlock) > historyFloor))

  const live = liveSpan(scannedSpans)
  const nearAnchor = atBlock != null ? spanNear(scannedSpans, Number(atBlock)) : undefined
  const forwardBoundary = nearAnchor ? BigInt(nearAnchor.toBlock) : null
  const canFetchForwardHistory = strategy === 'reverseChunked' && atBlock != null
    && (scannedSpans.length === 0 || nearAnchor !== live)

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
          scannedSpans: [],
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
    fetchForwardHistory,
    canFetchForwardHistory,
    forwardBoundary,
    scanRange,
    scannedSpans,
    scanFloor: historyFloor,
    blockRangeLimit,
    blockNumber: blockNumber.data,
    refetch: () => queryClient.invalidateQueries({ queryKey: threadsKey({ chainId, boardId }) }),
  }
}
