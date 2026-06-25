import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRef, useRef, useEffect, useContext, useState, useCallback, type RefObject } from 'react'
import { useConnection, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { useSettings } from './useSettings'
import { tryRecurseBlockFilter } from '../utils/blockchain'
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
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const unwatchRef = useRef<(() => void) | null>(null)
  const { updateMetadata } = useBoard(boardId, chainId)
  const { settings } = useSettings()

  const strategy = settings?.indexingStrategy
  const blockRangeLimit = settings ? BigInt(settings.blockRangeLimit) : 0n
  const enabled = useEnabled({ publicClient, address, hashchan, threadId, chainId: chain?.id, db, blockNumber: blockNumber.data, settings })

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

      const cachedThread = await db!.threads.where('threadId').equals(threadId).first()
      let thread: ThreadView

      if (cachedThread) {
        thread = {
          lastSynced: cachedThread.lastSynced,
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
        const threadFromBlock = strategy === 'reverseChunked'
          ? (blockNumber.data! > blockRangeLimit ? blockNumber.data! - blockRangeLimit : 0n)
          : 0n
        let threadFilter: any
        if (strategy === 'reverseChunked') {
          threadFilter = await publicClient!.createContractEventFilter({
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewThread',
            args: { threadId },
            fromBlock: threadFromBlock,
            toBlock: blockNumber.data,
          })
        } else {
          const { filter } = await tryRecurseBlockFilter(publicClient!, {
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewThread',
            args: { threadId },
            fromBlock: threadFromBlock,
            toBlock: blockNumber.data,
          })
          threadFilter = filter
        }
        const threadLogs = await publicClient!.getFilterLogs({ filter: threadFilter })
        const { creator, content, threadId: tid, imgUrl, imgCID, timestamp } = (threadLogs[0] as unknown as FilterLog<NewThreadArgs>).args
        thread = {
          lastSynced: 0,
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
        const postsFromBlock = strategy === 'reverseChunked'
          ? (blockNumber.data! > blockRangeLimit ? blockNumber.data! - blockRangeLimit : 0n)
          : BigInt(thread.lastSynced ? thread.lastSynced - 1 : 0)

        let filter: any
        if (strategy === 'reverseChunked') {
          filter = await publicClient!.createContractEventFilter({
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewPost',
            args: { threadId },
            fromBlock: postsFromBlock,
            toBlock: blockNumber.data,
          })
        } else {
          const result = await tryRecurseBlockFilter(publicClient!, {
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewPost',
            args: { threadId },
            fromBlock: postsFromBlock,
            toBlock: blockNumber.data,
          })
          filter = result.filter
          isReduced = result.isReduced
        }
        const logs = await publicClient!.getFilterLogs({ filter })

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
          } catch (e) {
            console.log('Duplicate post, skipping')
          }
        }

        await db!.threads.where('threadId').equals(threadId).modify({ lastSynced: Number(blockNumber.data) })
        if (logs.length > 0) updateMetadata({ postCount: logs.length })
      } catch (e) {
        console.log('Failed to fetch new posts from chain:', e)
        isReduced = true
      }

      return {
        posts: Object.values(logsObj).map(p => ({ ...p, content: sanitize(p.content) })),
        isReducedMode: isReduced,
      }
    },
  })

  useEffect(() => {
    if (!hashchan || !threadId || !db || !blockNumber.data || !publicClient) return

    const unwatch = publicClient.watchContractEvent({
      address: hashchan.address,
      abi: hashchan.abi,
      eventName: 'NewPost',
      fromBlock: blockNumber.data - 2n,
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
          (old: { posts: PostView[] } = { posts: [] }) => ({
            ...old,
            posts: [
              ...old.posts.map((post) =>
                newPost.replyIds.includes(post.postId || post.threadId || '')
                  ? { ...post, replies: [...post.replies, { ref: newPost.ref, id: postId }] }
                  : post
              ),
              newPost,
            ],
          })
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
  }, [hashchan, threadId, db, blockNumber.data])

  const [historyBoundary, setHistoryBoundary] = useState<bigint | null>(null)

  useEffect(() => {
    if (!db || !threadId) return
    db.threads.where('threadId').equals(threadId).first().then((t) => {
      setHistoryBoundary(t?.scanBoundary != null ? BigInt(t.scanBoundary) : null)
    })
  }, [threadId, chainId, db])

  const fetchHistory = useCallback(async () => {
    if (!blockNumber.data || !publicClient || !hashchan || !db || blockRangeLimit === 0n) return

    const toBlock = historyBoundary ?? (blockNumber.data > blockRangeLimit ? blockNumber.data - blockRangeLimit : 0n)
    if (toBlock === 0n) return
    const fromBlock = toBlock > blockRangeLimit ? toBlock - blockRangeLimit : 0n

    try {
      const filter: any = await publicClient.createContractEventFilter({
        address: hashchan.address,
        abi: hashchan.abi,
        eventName: 'NewPost',
        args: { threadId },
        fromBlock,
        toBlock,
      })
      const logs = await publicClient.getFilterLogs({ filter })

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
        } catch {
          // duplicate, skip
        }
      }

      if (logs.length > 0) updateMetadata({ postCount: logs.length })
      setHistoryBoundary(fromBlock)
      await db.threads.where('threadId').equals(threadId).modify({ scanBoundary: Number(fromBlock) })
      queryClient.invalidateQueries({ queryKey: threadKey({ chainId, boardId, threadId }) })
    } catch (e) {
      console.log('[useThread] fetchHistory error:', e)
    }
  }, [historyBoundary, blockNumber.data, blockRangeLimit, publicClient, hashchan, db, threadId, boardId, chainId, queryClient, updateMetadata])

  const canFetchHistory = strategy === 'reverseChunked'
    && !!blockNumber.data
    && (historyBoundary === null || historyBoundary > 0n)

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
