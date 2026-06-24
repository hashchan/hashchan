import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'

import { IDBContext } from '../provider/IDBProvider'
import { bookmarkedPostsKey } from '../utils/queryKeys'

interface BookmarkedThread {
  type: 'thread'
  threadId: string
  boardId: string
  creator: string
  imgUrl: string
  imgCID: string
  content: string
  timestamp: number
  bookmarked: number
  replyIds: string[]
}

interface BookmarkedPost {
  type: 'post'
  postId: string
  threadId: string
  boardId: string
  creator: string
  imgUrl: string
  imgCID: string
  content: string
  timestamp: number
  bookmarked: number
  replyIds: string[]
}

export type BookmarkedItem = BookmarkedThread | BookmarkedPost

export const useBookmarkedPosts = (boardId: number, chainId: number) => {
  const { db } = useContext(IDBContext)

  const { data: bookmarkedItems = [], isLoading, error } = useQuery({
    queryKey: bookmarkedPostsKey({ chainId, boardId }),
    enabled: !!db && boardId != null && chainId != null,
    queryFn: async (): Promise<BookmarkedItem[]> => {
      const results: BookmarkedItem[] = []

      const bookmarkedThreads = await db!.threads
        .where('bookmarked')
        .equals(1)
        .and((thread) => thread.boardId === boardId)
        .toArray()

      bookmarkedThreads.forEach((thread) => {
        results.push({
          type: 'thread',
          threadId: thread.threadId,
          boardId: String(thread.boardId),
          creator: thread.creator,
          imgUrl: thread.imgUrl,
          imgCID: thread.imgCID,
          content: thread.content,
          timestamp: thread.timestamp,
          bookmarked: thread.bookmarked,
          replyIds: [],
        })
      })

      const bookmarkedPosts = await db!.posts
        .where('bookmarked')
        .equals(1)
        .and((post) => post.boardId === boardId)
        .toArray()

      bookmarkedPosts.forEach((post) => {
        results.push({
          type: 'post',
          postId: post.postId,
          threadId: post.threadId,
          boardId: String(post.boardId),
          creator: post.creator,
          imgUrl: post.imgUrl,
          imgCID: post.imgCID,
          content: post.content,
          timestamp: post.timestamp,
          bookmarked: post.bookmarked,
          replyIds: post.replyIds,
        })
      })

      return results.sort((a, b) => b.timestamp - a.timestamp)
    },
  })

  return { bookmarkedItems, isLoading, error }
}
