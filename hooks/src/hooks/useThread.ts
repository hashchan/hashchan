import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRef, useRef, useEffect, useContext, useCallback, type RefObject } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useHookSettings } from './useHookSettings'
import { chunkedFetchLogs, fetchAllLogs, clampFromBlock } from '../utils/blockchain'
import { mergeSpan, liveSpan, earliestSpan, spanNear, type Span } from '../utils/spans'
import { useEnabled } from '../utils/enabled'
import { parseContent } from '../utils/content'
import { type PostView, type ThreadView } from '../types/posts'
import { type NewThreadArgs, type NewPostArgs, type FilterLog } from '../types/events'
import { threadKey, bookmarkedPostsKey } from '../utils/queryKeys'

export type { PostView } from '../types/posts'

// Fibonacci, matching the rest of the app's golden-ratio/Fibonacci styling
// and sizing conventions (see web's ScanMap). A caller-supplied toBlockHint
// bounds the remaining gap to a known, finite size — the whole point of a
// shared link carrying one is to let the recipient grab it in one shot
// instead of clicking "scan forward" repeatedly — so fetchForward may fetch
// up to this many blockRangeLimit windows in a single call when a hint is
// present, rather than just one. Still capped, so an implausibly wide hint
// (e.g. genesis-to-tip) can't fire an unbounded burst of RPC calls.
const MAX_FORWARD_WINDOWS = 21n

export const useThread = (boardId: number, chainId: number, threadId: string, atBlock?: bigint, toBlockHint?: bigint) => {
  const { db, sanitize } = useContext(IDBContext)
  const { address, chain } = useConnection()
  const blockNumber = useBlockNumber()
  const publicClient = usePublicClient()
  const { hashchan, hashchanDeployedAtBlock } = useContracts()
  const queryClient = useQueryClient()
  const unwatchRef = useRef<(() => void) | null>(null)
  const { updateMetadata } = useBoard(boardId, chainId)
  const { hookSettings } = useHookSettings()

  const strategy = hookSettings?.indexingStrategy
  const blockRangeLimit = hookSettings ? BigInt(hookSettings.blockRangeLimit) : 0n
  const enabled = useEnabled({ publicClient, address, hashchan, threadId, chainId: chain?.id, db, hookSettings, hashchanDeployedAtBlock })

  const {
    data: { posts = [], isReducedMode = false, scannedSpans = [], blockCreatedAt: queriedBlockCreatedAt } = {},
    error,
    isLoading,
  } = useQuery({
    queryKey: threadKey({ chainId, boardId, threadId }),
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const refsObj: Record<string, RefObject<unknown>> = {}
      const logsObj: Record<string, PostView> = {}

      // Snapshot the chain head once per fetch, decoupled from the reactively
      // updating useBlockNumber() value below.
      const toBlock = await publicClient!.getBlockNumber()

      const cachedThread = await db!.threads.where('threadId').equals(threadId).first()
      let thread: ThreadView
      let threadSpans: Span[] = cachedThread?.scannedSpans ?? []

      if (cachedThread) {
        thread = {
          lastSynced: cachedThread.lastSynced,
          blockCreatedAt: cachedThread.blockCreatedAt,
          creator: cachedThread.creator,
          threadId: cachedThread.threadId,
          imgUrl: cachedThread.imgUrl,
          imgCID: cachedThread.imgCID,
          content: cachedThread.content,
          bookmarked: cachedThread.bookmarked,
          replies: [],
          replyIds: [],
          timestamp: Number(cachedThread.timestamp),
        }
      } else {
        // One-off lookup for this specific thread's own creation event — not
        // an incremental sync, so there's no lastSynced to bridge from. When
        // atBlock is known (a link shared with the thread's own
        // blockCreatedAt), search a window centered on it instead of the
        // blind "last blockRangeLimit blocks before tip" guess — otherwise a
        // thread older than one window is invisible to a fresh reverseChunked
        // client and this lookup comes back empty.
        const threadFromBlock = atBlock != null && strategy === 'reverseChunked'
          ? clampFromBlock(atBlock - blockRangeLimit, hashchanDeployedAtBlock!)
          : strategy === 'reverseChunked'
            ? clampFromBlock(toBlock - blockRangeLimit, hashchanDeployedAtBlock!)
            : hashchanDeployedAtBlock!
        const threadToBlockCandidate = atBlock != null && strategy === 'reverseChunked' ? atBlock + blockRangeLimit : toBlock
        const threadToBlock = threadToBlockCandidate > toBlock ? toBlock : threadToBlockCandidate

        const threadFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { threadId },
          fromBlock: threadFromBlock,
          toBlock: threadToBlock,
        }

        let threadLog: FilterLog<NewThreadArgs> | undefined
        try {
          const threadLogs = strategy === 'reverseChunked'
            ? await chunkedFetchLogs(publicClient!, threadFilterArgs, blockRangeLimit)
            : await fetchAllLogs(publicClient!, threadFilterArgs)
          threadLog = threadLogs[0] as unknown as FilterLog<NewThreadArgs> | undefined
        } catch (e) {
          console.error('[hashchan] Failed to look up thread creation log:', e)
        }

        if (!threadLog) {
          // atBlock (if any) didn't land on the creation log in this window,
          // or the RPC call itself failed — don't crash the query, degrade
          // to an empty, reduced-mode result instead. The forward cursor (if
          // atBlock was supplied) lets the user widen the search manually.
          return { posts: [], isReducedMode: true }
        }

        const { creator, content, threadId: tid, imgUrl, imgCID, timestamp, title, boardId: logBoardId } = threadLog.args
        thread = {
          lastSynced: 0,
          blockCreatedAt: Number(threadLog.blockNumber),
          creator,
          threadId: tid,
          imgUrl,
          imgCID,
          replies: [],
          replyIds: [],
          content,
          bookmarked: 0,
          timestamp: Number(timestamp),
        }

        // Persist the discovered thread row now, not just the in-memory view
        // above — otherwise the .modify() calls below (and every future
        // fetchHistory/fetchForward/scanRange call) silently no-op against a
        // row that was never inserted, and this same expensive bootstrap
        // search reruns on every render instead of being a true one-off.
        try {
          await db!.threads.add({
            lastSynced: 0,
            scannedSpans: [],
            blockCreatedAt: Number(threadLog.blockNumber),
            boardId: Number(logBoardId ?? boardId),
            threadId: tid,
            creator,
            imgUrl,
            imgCID,
            title,
            bookmarked: 0,
            content,
            chainId,
            timestamp: Number(timestamp),
          })
        } catch (e) {
          console.log('Duplicate thread, skipping')
        }
      }

      refsObj[thread.threadId] = createRef()
      logsObj[thread.threadId] = { ...thread, ref: refsObj[thread.threadId] }

      const cachedPosts = await db!.posts.where('threadId').equals(threadId).sortBy('timestamp')

      cachedPosts.forEach((post) => {
        refsObj[post.postId] = createRef()
        logsObj[post.postId] = {
          creator: post.creator,
          postId: post.postId,
          imgUrl: post.imgUrl,
          imgCID: post.imgCID,
          content: post.content,
          timestamp: post.timestamp,
          bookmarked: post.bookmarked,
          replyIds: post.replyIds,
          replies: [],
          ref: refsObj[post.postId],
        }
        post.replyIds.forEach((replyId) => {
          if (logsObj[replyId]) {
            logsObj[replyId].replies.push({ ref: refsObj[post.postId], id: post.postId })
          }
        })
      })

      let isReduced = false
      try {
        // thread.blockCreatedAt (known immediately for freshly-created threads
        // via useCreateThread.ts, or captured for free from the NewThread
        // log's own blockNumber once discovered above) is a tighter floor
        // than the contract's deployment block — a thread's posts can't
        // exist before the thread itself did.
        const threadFloor = thread.blockCreatedAt != null ? BigInt(thread.blockCreatedAt) : hashchanDeployedAtBlock!

        // liveSpan is the region tip-tailing sync keeps extending — bridge
        // from wherever it currently ends, however large that gap is. If
        // nothing has been scanned yet (no spans at all), reverseChunked
        // seeds a shallow recent window instead of all of history;
        // fullNode/bulkScrape fetch the whole floor-to-tip gap unbounded.
        const live = liveSpan(threadSpans)
        const postsFromBlock = live
          ? BigInt(live.toBlock) + 1n
          : strategy === 'reverseChunked'
            ? clampFromBlock(toBlock - blockRangeLimit, threadFloor)
            : threadFloor

        if (toBlock > postsFromBlock) {
          const postsFilterArgs = {
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewPost',
            args: { threadId },
            fromBlock: postsFromBlock,
            toBlock,
          }
          const logs = strategy === 'reverseChunked'
            ? await chunkedFetchLogs(publicClient!, postsFilterArgs, blockRangeLimit)
            : await fetchAllLogs(publicClient!, postsFilterArgs)

          // Counts only posts actually newly persisted, not raw fetched logs —
          // a log can be legitimately re-fetched here (e.g. the live watcher
          // below already caught it) and correctly no-op as a duplicate, but
          // that must not also increment the board's postCount a second time.
          let newPostCount = 0
          for (const log of logs) {
            const { creator, postId, imgUrl, imgCID, content, replyIds, timestamp } = (log as unknown as FilterLog<NewPostArgs>).args
            if (logsObj[postId]) continue

            refsObj[postId] = createRef()
            const newPost: PostView = {
              creator,
              postId,
              imgUrl,
              imgCID,
              timestamp: Number(timestamp),
              replies: [],
              replyIds,
              bookmarked: 0,
              content,
              ref: refsObj[postId],
            }
            logsObj[postId] = newPost
            replyIds.forEach((replyId: string) => {
              if (logsObj[replyId]) {
                logsObj[replyId].replies.push({ ref: refsObj[postId], id: postId })
              }
            })

            try {
              await db!.posts.add({
                boardId,
                threadId,
                postId,
                creator: creator as `0x${string}`,
                imgUrl,
                imgCID,
                bookmarked: 0,
                content,
                timestamp: Number(timestamp),
                replyIds,
              })
              newPostCount++
            } catch (e) {
              console.log('Duplicate post, skipping')
            }
          }

          threadSpans = mergeSpan(threadSpans, { fromBlock: Number(live?.fromBlock ?? postsFromBlock), toBlock: Number(toBlock) })
          await db!.threads.where('threadId').equals(threadId).modify({
            scannedSpans: threadSpans,
            lastSynced: liveSpan(threadSpans)?.toBlock ?? 0,
          })
          if (newPostCount > 0) updateMetadata({ postCount: newPostCount })
        }
      } catch (e) {
        console.error('[hashchan] Failed to fetch new posts from chain:', e)
        isReduced = true
      }

      return {
        posts: Object.values(logsObj).map(p => ({ ...p, content: sanitize(p.content) })),
        isReducedMode: isReduced,
        scannedSpans: threadSpans,
        blockCreatedAt: thread!.blockCreatedAt,
      }
    },
  })

  useEffect(() => {
    if (!hashchan || !threadId || !db || !publicClient) return

    // No fromBlock here (matches useThreads.ts's NewThread watcher) — this
    // watches forward from 'latest' as a persistent subscription that's set up
    // once and left running, rather than being torn down and recreated on
    // every new block.
    const unwatch = publicClient.watchContractEvent({
      address: hashchan.address,
      abi: hashchan.abi,
      eventName: 'NewPost',
      args: { threadId },
      onLogs: async (logs: any[]) => {
        const { creator, content, postId, imgUrl, imgCID, timestamp } = logs[0].args
        const replyIds = parseContent(content)
        const newPost: PostView = {
          creator,
          postId: String(postId),
          imgUrl,
          imgCID,
          content: sanitize(content),
          timestamp: Number(timestamp),
          replyIds,
          bookmarked: 0,
          replies: [],
          ref: createRef(),
        }

        queryClient.setQueryData(
          threadKey({ chainId, boardId, threadId }),
          (old: { posts: PostView[] } = { posts: [] }) => {
            // A queryFn refetch (e.g. triggered by the submitting component's
            // own tx-confirmation path) can independently pick up this same
            // on-chain event before this watcher does — don't append a second
            // copy into the cache if it's already there.
            if (old.posts.some((post) => post.postId === newPost.postId)) return old

            return {
              ...old,
              posts: [
                ...old.posts.map((post) =>
                  newPost.replyIds.includes(post.postId || post.threadId || '')
                    ? { ...post, replies: [...post.replies, { ref: newPost.ref, id: postId }] }
                    : post
                ),
                newPost,
              ],
            }
          }
        )

        try {
          await db!.posts.add({
            boardId,
            threadId,
            postId: String(postId),
            creator: creator as `0x${string}`,
            imgUrl,
            imgCID,
            bookmarked: 0,
            content,
            timestamp: Number(timestamp),
            replyIds,
          })
          updateMetadata({ postCount: 1 })
        } catch (e) {
          console.log('Duplicate post, skipping')
        }
      },
    })

    unwatchRef.current = unwatch
    return () => {
      unwatchRef.current?.()
      unwatchRef.current = null
    }
  }, [hashchan, threadId, db, publicClient])

  // scannedSpans/blockCreatedAt come straight from the query's own data
  // (queriedBlockCreatedAt above) rather than a separate useState hydrated by
  // its own effect — that used to be two independently-timed sources of
  // truth for the same thing, which raced (and could show a blank/stale
  // scan-map right after a reload while the bootstrap effect was still
  // pending). scanRange patches this same query's cache directly (see
  // below), so there's exactly one place this data lives.
  const cachedThreadFloor = queriedBlockCreatedAt != null ? BigInt(queriedBlockCreatedAt) : null

  // The one place raw logs get fetched and turned into persisted posts plus
  // an updated span, for any caller (fetchHistory, fetchForward, or a
  // scan-map UI clicking an arbitrary cell) that already knows exactly which
  // [fromBlock, toBlock] window it wants. Always re-reads scannedSpans fresh
  // from Dexie rather than trusting the scannedSpans React state, which can
  // be one render behind the live queryFn's own writes.
  const scanRange = useCallback(async (fromBlock: bigint, toBlock: bigint) => {
    if (!publicClient || !hashchan || !db || blockRangeLimit === 0n || toBlock < fromBlock) return
    const cachedThread = await db.threads.where('threadId').equals(threadId).first()
    const spans = cachedThread?.scannedSpans ?? []

    try {
      const logs = await chunkedFetchLogs(publicClient, {
        address: hashchan.address,
        abi: hashchan.abi,
        eventName: 'NewPost',
        args: { threadId },
        fromBlock,
        toBlock,
      }, blockRangeLimit)

      let newPostCount = 0
      for (const log of logs) {
        const logArgs = (log as unknown as FilterLog<NewPostArgs>).args
        try {
          await db.posts.add({
            boardId,
            threadId,
            postId: logArgs.postId,
            creator: logArgs.creator as `0x${string}`,
            imgUrl: logArgs.imgUrl,
            imgCID: logArgs.imgCID,
            bookmarked: 0,
            content: logArgs.content,
            timestamp: Number(logArgs.timestamp),
            replyIds: logArgs.replyIds,
          })
          newPostCount++
        } catch {
          // duplicate, skip
        }
      }

      if (newPostCount > 0) updateMetadata({ postCount: newPostCount })
      const newSpans = mergeSpan(spans, { fromBlock: Number(fromBlock), toBlock: Number(toBlock) })
      await db.threads.where('threadId').equals(threadId).modify({
        scannedSpans: newSpans,
        lastSynced: liveSpan(newSpans)?.toBlock ?? 0,
      })
      // Patch this query's cache directly for an instant scan-map/cursor
      // update - invalidateQueries below still triggers the real refetch
      // (to pick up any newly-fetched posts), but that's a network round
      // trip; this makes the span change visible immediately rather than
      // leaving the UI showing pre-scanRange spans until it resolves.
      queryClient.setQueryData(
        threadKey({ chainId, boardId, threadId }),
        (old: { scannedSpans: Span[] } | undefined) => old ? { ...old, scannedSpans: newSpans } : old
      )
      queryClient.invalidateQueries({ queryKey: threadKey({ chainId, boardId, threadId }) })
    } catch (e) {
      console.log('[useThread] scanRange error:', e)
    }
  }, [blockRangeLimit, publicClient, hashchan, db, threadId, boardId, chainId, queryClient, updateMetadata])

  // Extend the earliest known span one blockRangeLimit window further back —
  // the existing manual "scan backwards" action.
  const fetchHistory = useCallback(async () => {
    if (!db || !publicClient || hashchanDeployedAtBlock == null || blockRangeLimit === 0n) return

    const cachedThread = await db.threads.where('threadId').equals(threadId).first()
    const threadFloor = cachedThread?.blockCreatedAt != null ? BigInt(cachedThread.blockCreatedAt) : hashchanDeployedAtBlock
    const spans = cachedThread?.scannedSpans ?? []
    const earliest = earliestSpan(spans)

    const head = await publicClient.getBlockNumber()
    const toBlock = earliest ? BigInt(earliest.fromBlock) - 1n : clampFromBlock(head - blockRangeLimit, threadFloor)
    if (toBlock <= threadFloor) return
    const fromBlock = clampFromBlock(toBlock - blockRangeLimit + 1n, threadFloor)

    await scanRange(fromBlock, toBlock)
  }, [scanRange, db, publicClient, hashchanDeployedAtBlock, blockRangeLimit, threadId])

  // Extend the atBlock-anchored span forward, toward wherever the
  // live/tip-tailed span currently starts. Once the two meet, mergeSpan
  // coalesces them and this naturally has nothing left to do. Without a
  // toBlockHint this advances one blockRangeLimit window per call (the
  // manual "scan forward" button); with one — e.g. from a shared link whose
  // sharer already knows both ends of the range — it grabs up to
  // MAX_FORWARD_WINDOWS at once, since the hint makes the remaining gap a
  // known, finite size rather than an open-ended chase toward a moving tip.
  const fetchForward = useCallback(async () => {
    if (!db || !publicClient || atBlock == null || blockRangeLimit === 0n) return

    const cachedThread = await db.threads.where('threadId').equals(threadId).first()
    const spans = cachedThread?.scannedSpans ?? []
    const live = liveSpan(spans)
    const existing = spanNear(spans, Number(atBlock))
    if (existing && existing === live) return // already merged

    const tip = await publicClient.getBlockNumber()
    const fromBlock = existing ? BigInt(existing.toBlock) + 1n : atBlock
    const liveFloorCap = live ? BigInt(live.fromBlock) - 1n : tip
    const ceilingCandidates = toBlockHint != null ? [liveFloorCap, tip, toBlockHint] : [liveFloorCap, tip]
    const ceiling = ceilingCandidates.reduce((a, b) => (b < a ? b : a))

    const perCallLimit = blockRangeLimit * (toBlockHint != null ? MAX_FORWARD_WINDOWS : 1n)
    const windowEnd = fromBlock + perCallLimit - 1n
    const toBlock = windowEnd < ceiling ? windowEnd : ceiling
    if (toBlock < fromBlock) return

    await scanRange(fromBlock, toBlock)
  }, [scanRange, atBlock, toBlockHint, db, publicClient, blockRangeLimit, threadId])

  const historyFloor = cachedThreadFloor ?? hashchanDeployedAtBlock
  const earliest = earliestSpan(scannedSpans)
  const historyBoundary = earliest ? BigInt(earliest.fromBlock) : null
  const canFetchHistory = strategy === 'reverseChunked'
    && (earliest === undefined || (historyFloor != null && BigInt(earliest.fromBlock) > historyFloor))

  const live = liveSpan(scannedSpans)
  // Not just "the earliest span reaches the floor" - earliest is whichever
  // span has the lowest fromBlock, even if it's an island that hasn't merged
  // with the tip-tailing live span yet (e.g. from clicking the floor-most
  // scan-map cell directly). Only report done once there's exactly one span
  // (earliest === live, by reference - see spans.ts) spanning floor to tip.
  const isFullyScanned = strategy === 'reverseChunked'
    && earliest != null && earliest === live
    && historyFloor != null && BigInt(earliest.fromBlock) <= historyFloor
  const nearAnchor = atBlock != null ? spanNear(scannedSpans, Number(atBlock)) : undefined
  const forwardBoundary = nearAnchor ? BigInt(nearAnchor.toBlock) : null
  const reachedToBlockHint = toBlockHint != null && nearAnchor != null && BigInt(nearAnchor.toBlock) >= toBlockHint
  const canFetchForward = strategy === 'reverseChunked' && atBlock != null && !reachedToBlockHint
    && (scannedSpans.length === 0 || nearAnchor !== live)

  const bookmarkMutation = useMutation({
    mutationFn: async ({ postId }: { postId: string }) => {
      const isThread = postId === threadId
      if (isThread) {
        const current = await db!.threads.where('threadId').equals(threadId).first()
        if (!current) return null
        const newStatus = current.bookmarked === 1 ? 0 : 1
        await db!.threads.where('threadId').equals(threadId).modify({ bookmarked: newStatus })
        return { type: 'thread' as const, id: threadId, bookmarked: newStatus }
      } else {
        const current = await db!.posts.where('postId').equals(postId).first()
        if (!current) return null
        const newStatus = current.bookmarked === 1 ? 0 : 1
        await db!.posts.where('postId').equals(postId).modify({ bookmarked: newStatus })
        return { type: 'post' as const, id: postId, bookmarked: newStatus }
      }
    },
    onSuccess: (result) => {
      if (!result) return
      queryClient.setQueryData(
        threadKey({ chainId, boardId, threadId }),
        (old: { posts: PostView[] } = { posts: [] }) => ({
          ...old,
          posts: old.posts.map((post) => {
            const id = post.postId || post.threadId
            return id === result.id ? { ...post, bookmarked: result.bookmarked } : post
          }),
        })
      )
      queryClient.invalidateQueries({ queryKey: bookmarkedPostsKey({ chainId, boardId }) })
    },
  })

  return {
    posts,
    error,
    isLoading,
    isReducedMode,
    strategy,
    fetchHistory,
    canFetchHistory,
    historyBoundary,
    isFullyScanned,
    fetchForward,
    canFetchForward,
    forwardBoundary,
    scanRange,
    scannedSpans,
    scanFloor: historyFloor,
    blockRangeLimit,
    blockNumber: blockNumber.data,
    bookmark: bookmarkMutation.mutate,
  }
}
