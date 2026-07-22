import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRef, useRef, useEffect, useContext, useState, useCallback, type RefObject } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useHookSettings } from './useHookSettings'
import { chunkedFetchLogs, fetchAllLogs, clampFromBlock } from '../utils/blockchain'
import { useEnabled } from '../utils/enabled'
import { parseContent } from '../utils/content'
import { type PostView, type ThreadView } from '../types/posts'
import { type NewThreadArgs, type NewPostArgs, type FilterLog } from '../types/events'
import { threadKey, bookmarkedPostsKey } from '../utils/queryKeys'

export type { PostView } from '../types/posts'

export const useThread = (boardId: number, chainId: number, threadId: string) => {
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
    data: { posts = [], isReducedMode = false } = {},
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
        // an incremental sync, so there's no lastSynced to bridge from.
        const threadFromBlock = strategy === 'reverseChunked'
          ? clampFromBlock(toBlock - blockRangeLimit, hashchanDeployedAtBlock!)
          : hashchanDeployedAtBlock!

        const threadFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { threadId },
          fromBlock: threadFromBlock,
          toBlock,
        }
        const threadLogs = strategy === 'reverseChunked'
          ? await chunkedFetchLogs(publicClient!, threadFilterArgs, blockRangeLimit)
          : await fetchAllLogs(publicClient!, threadFilterArgs)

        const threadLog = threadLogs[0] as unknown as FilterLog<NewThreadArgs>
        const { creator, content, threadId: tid, imgUrl, imgCID, timestamp } = threadLog.args
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
        // Same dual-boundary bridging as useThreads.ts's board-level sync:
        // thread.lastSynced is the high-water mark shared by both strategies.
        // reverseChunked's first-ever sync seeds an initial recent window;
        // every later run for either strategy bridges from lastSynced to the
        // current tip, however large that gap is.
        // thread.blockCreatedAt (known immediately for freshly-created threads
        // via useCreateThread.ts, or captured for free from the NewThread
        // log's own blockNumber once discovered) is a tighter floor than the
        // contract's deployment block — a thread's posts can't exist before
        // the thread itself did.
        const threadFloor = thread.blockCreatedAt != null ? BigInt(thread.blockCreatedAt) : hashchanDeployedAtBlock!
        const isFirstPostSync = !thread.lastSynced
        const postsFromBlock = strategy === 'reverseChunked' && isFirstPostSync
          ? clampFromBlock(toBlock - blockRangeLimit, threadFloor)
          : BigInt(thread.lastSynced || threadFloor)

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

          const threadUpdate: { lastSynced: number; scanBoundary?: number } = { lastSynced: Number(toBlock) }
          if (strategy === 'reverseChunked' && isFirstPostSync) {
            threadUpdate.scanBoundary = Number(postsFromBlock)
            setHistoryBoundary(postsFromBlock)
          }
          await db!.threads.where('threadId').equals(threadId).modify(threadUpdate)
          if (newPostCount > 0) updateMetadata({ postCount: newPostCount })
        }
      } catch (e) {
        console.error('[hashchan] Failed to fetch new posts from chain:', e)
        isReduced = true
      }

      return {
        posts: Object.values(logsObj).map(p => ({ ...p, content: sanitize(p.content) })),
        isReducedMode: isReduced,
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

  const [historyBoundary, setHistoryBoundary] = useState<bigint | null>(null)
  const [cachedThreadFloor, setCachedThreadFloor] = useState<bigint | null>(null)

  useEffect(() => {
    if (!db || !threadId) return
    db.threads.where('threadId').equals(threadId).first().then((t) => {
      setHistoryBoundary(t?.scanBoundary != null ? BigInt(t.scanBoundary) : null)
      setCachedThreadFloor(t?.blockCreatedAt != null ? BigInt(t.blockCreatedAt) : null)
    })
  }, [threadId, chainId, db])

  const fetchHistory = useCallback(async () => {
    if (!publicClient || !hashchan || !db || hashchanDeployedAtBlock == null || blockRangeLimit === 0n) return

    // Prefer the thread's own creation block over the contract's deployment
    // block where known — there's nothing to find scanning further back than
    // when this specific thread was created.
    const cachedThread = await db.threads.where('threadId').equals(threadId).first()
    const threadFloor = cachedThread?.blockCreatedAt != null ? BigInt(cachedThread.blockCreatedAt) : hashchanDeployedAtBlock

    const head = await publicClient.getBlockNumber()
    const toBlock = historyBoundary ?? clampFromBlock(head - blockRangeLimit, threadFloor)
    if (toBlock <= threadFloor) return
    const fromBlock = clampFromBlock(toBlock - blockRangeLimit, threadFloor)

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
      setHistoryBoundary(fromBlock)
      await db.threads.where('threadId').equals(threadId).modify({ scanBoundary: Number(fromBlock) })
      queryClient.invalidateQueries({ queryKey: threadKey({ chainId, boardId, threadId }) })
    } catch (e) {
      console.log('[useThread] fetchHistory error:', e)
    }
  }, [historyBoundary, blockRangeLimit, publicClient, hashchan, hashchanDeployedAtBlock, db, threadId, boardId, chainId, queryClient, updateMetadata])

  const historyFloor = cachedThreadFloor ?? hashchanDeployedAtBlock
  const canFetchHistory = strategy === 'reverseChunked'
    && (historyBoundary === null || (historyFloor != null && historyBoundary > historyFloor))

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
    blockNumber: blockNumber.data,
    bookmark: bookmarkMutation.mutate,
  }
}
