import { useQuery } from '@tanstack/react-query'
import { useContext } from 'react'
import { useParams } from 'react-router-dom'
import { IDBContext } from '@/provider/IDBProvider'

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

type BookmarkedItem = BookmarkedThread | BookmarkedPost

const createQueryKey = (chainId: string | undefined, boardId: string | undefined) => [
  'bookmarked-posts',
  chainId,
  boardId
]

export const useBookmarkedPosts = () => {
  const { chainId, boardId } = useParams()
  const { db } = useContext(IDBContext)

  const { data: bookmarkedItems = [], isLoading, error } = useQuery({
    queryKey: createQueryKey(chainId, boardId),
    queryFn: async (): Promise<BookmarkedItem[]> => {
      if (!db || !chainId || !boardId) return []

      const results: BookmarkedItem[] = []

      // Fetch bookmarked threads
      const bookmarkedThreads = await db.threads
        .where('bookmarked')
        .equals(1)
        .and(thread => thread.boardId === Number(boardId))
        .toArray()

      bookmarkedThreads.forEach(thread => {
        results.push({
          type: 'thread',
          threadId: thread.threadId,
          boardId: thread.boardId.toString(),
          creator: thread.creator,
          imgUrl: thread.imgUrl,
          imgCID: thread.imgCID,
          content: thread.content,
          timestamp: thread.timestamp,
          bookmarked: thread.bookmarked,
          replyIds: []
        })
      })

      // Fetch bookmarked posts
      const bookmarkedPosts = await db.posts
        .where('bookmarked')
        .equals(1)
        .and(post => post.boardId === Number(boardId))
        .toArray()

      bookmarkedPosts.forEach(post => {
        results.push({
          type: 'post',
          postId: post.postId,
          threadId: post.threadId,
          boardId: post.boardId.toString(),
          creator: post.creator,
          imgUrl: post.imgUrl,
          imgCID: post.imgCID,
          content: post.content,
          timestamp: post.timestamp,
          bookmarked: post.bookmarked,
          replyIds: post.replyIds
        })
      })

      // Sort by timestamp (newest first)
      return results.sort((a, b) => b.timestamp - a.timestamp)
    },
    enabled: !!db && !!chainId && !!boardId
  })

  return {
    bookmarkedItems,
    isLoading,
    error
  }
}
