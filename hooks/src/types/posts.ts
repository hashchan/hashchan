import type { RefObject } from 'react'

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
  replies: Array<{ ref: RefObject<unknown>; id: string }>
  ref: RefObject<unknown>
}

// Thread shape before the ref is attached. threadId is required (unlike PostView where it's optional).
export type ThreadView = Omit<PostView, 'ref' | 'threadId'> & { lastSynced: number; threadId: string; blockCreatedAt?: number }
