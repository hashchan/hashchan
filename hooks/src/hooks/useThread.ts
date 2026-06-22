import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createRef, useRef, useEffect, useContext } from 'react'
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { useBoard } from './useBoard'
import { tryRecurseBlockFilter } from '../utils/blockchain'
import { parseContent } from '../utils/content'

export interface PostView {
  creator: string
  postId?: string
  threadId?: string
  imgUrl: string
  imgCID: string
  content: string
  timestamp: number
  bookmarked: number
  replyIds: string[]
  replies: Array<{ ref: any; id: string }>
  ref: any
}

const createQueryKey = (chainId: number, boardId: number, threadId: string, blockNumber: number | undefined) =>
  ['chain', chainId, 'board', boardId, 'thread', threadId, blockNumber] as const

export const useThread = (boardId: number, chainId: number, threadId: string) => {
  const { db } = useContext(IDBContext)
  const { address, chain } = useAccount()
  const blockNumber = useBlockNumber()
  const publicClient = usePublicClient()
  const { hashchan } = useContracts()
  const queryClient = useQueryClient()
  const unwatchRef = useRef<(() => void) | null>(null)
  const { updateMetadata } = useBoard(boardId, chainId)

  const {
    data: { posts = [], isReducedMode = false } = {},
    error,
    isLoading,
  } = useQuery({
    queryKey: createQueryKey(chainId, boardId, threadId, Number(blockNumber.data)),
    enabled: Boolean(
      publicClient && address && hashchan && threadId && chain?.id && db && boardId && blockNumber.data
    ),
    queryFn: async () => {
      const refsObj: Record<string, any> = {}
      const logsObj: Record<string, PostView> = {}

      const cachedThread = await db!.threads.where('threadId').equals(threadId).first()
      let thread: any

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
        const { filter: threadFilter } = await tryRecurseBlockFilter(publicClient!, {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: { threadId },
          fromBlock: 0n,
          toBlock: blockNumber.data,
        })
        const threadLogs = await publicClient!.getFilterLogs({ filter: threadFilter })
        const { creator, content, threadId: tid, imgUrl, imgCID, timestamp } = (threadLogs[0] as any).args
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

      cachedPosts.forEach((post: any) => {
        post.replies = []
        refsObj[post.postId] = createRef()
        logsObj[post.postId] = { ...post, ref: refsObj[post.postId] }
        post.replyIds.forEach((replyId: string) => {
          if (logsObj[replyId]) {
            logsObj[replyId].replies.push({ ref: refsObj[post.postId], id: post.postId })
          }
        })
      })

      let isReduced = false
      try {
        const { filter, isReduced: r } = await tryRecurseBlockFilter(publicClient!, {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewPost',
          args: { threadId },
          fromBlock: BigInt(thread.lastSynced ? thread.lastSynced - 1 : 0),
          toBlock: blockNumber.data,
        })
        const logs = await publicClient!.getFilterLogs({ filter })
        isReduced = r

        for (const log of logs) {
          const { creator, postId, imgUrl, imgCID, content, replyIds, timestamp } = (log as any).args
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

      return { posts: Object.values(logsObj), isReducedMode: isReduced }
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
          content,
          timestamp: Number(timestamp),
          replyIds,
          bookmarked: 0,
          replies: [],
          ref: createRef(),
        }

        queryClient.setQueryData(
          createQueryKey(chainId, boardId, threadId, Number(blockNumber.data)),
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
        createQueryKey(chainId, boardId, threadId, Number(blockNumber.data)),
        (old: { posts: PostView[] } = { posts: [] }) => ({
          ...old,
          posts: old.posts.map((post) => {
            const id = post.postId || post.threadId
            return id === result.id ? { ...post, bookmarked: result.bookmarked } : post
          }),
        })
      )
      queryClient.invalidateQueries({ queryKey: ['bookmarked-posts', chainId, boardId] })
    },
  })

  return {
    posts,
    error,
    isLoading,
    isReducedMode,
    bookmark: bookmarkMutation.mutate,
  }
}
