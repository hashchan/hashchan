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

// ModerationServiceFactory events
export interface NewModerationServiceArgs {
  owner: `0x${string}`
  moderationService: `0x${string}`
  blockNumber: bigint
  name: string
}

// ModerationService events
export interface NewJanitorArgs {
  janitor: `0x${string}`
}

export interface OwnershipTransferredArgs {
  previousOwner: `0x${string}`
  newOwner: `0x${string}`
}

export interface URLUpdatedArgs {
  uri: string
  port: bigint
}

// getFilterLogs returns Log[] without typed .args — this wrapper expresses
// what we know about the shape after createContractEventFilter. blockNumber
// is a real field on every viem Log (mined logs always have it set), used to
// capture a board/thread's own creation block for free while scanning.
export type FilterLog<T> = { args: T; blockNumber: bigint }

// Lifecycle of a submitted contract write:
//   idle → submitting (wallet prompt) → pending (hash received, mining) → confirmed (event log received)
//   Any phase can transition to error.
export type TxStatus = 'idle' | 'submitting' | 'pending' | 'confirmed' | 'error'
