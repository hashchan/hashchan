export interface NewBoardArgs {
  boardId: bigint
  name: string
  symbol: string
  description: string
  bannerUrl: string
  bannerCID: string
  rules: string[]
  timestamp: bigint
}

export interface NewThreadArgs {
  boardId: bigint
  threadId: `0x${string}`
  creator: `0x${string}`
  imgUrl: string
  imgCID: string
  title: string
  content: string
  timestamp: bigint
}

export interface NewPostArgs {
  boardId: bigint
  threadId: `0x${string}`
  postId: `0x${string}`
  replyIds: `0x${string}`[]
  creator: `0x${string}`
  imgUrl: string
  imgCID: string
  content: string
  timestamp: bigint
}

// getFilterLogs returns Log[] without typed .args — this wrapper expresses
// what we know about the shape after createContractEventFilter.
export type FilterLog<T> = { args: T }
