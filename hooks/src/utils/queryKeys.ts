export interface ThreadsQueryKeyParams {
  chainId: number
  boardId: number
  blockNumber: bigint | undefined
}

export interface ThreadQueryKeyParams {
  chainId: number
  boardId: number
  threadId: string
  blockNumber: number | undefined
}

export const boardKey = ({ chainId, boardId }: { chainId: number; boardId: number }) =>
  ['board', chainId, boardId] as const

export const boardsKey = ({ chainId }: { chainId: number }) =>
  ['boards', chainId] as const

export const bookmarkedPostsKey = ({ chainId, boardId }: { chainId: number; boardId: number }) =>
  ['bookmarked-posts', chainId, boardId] as const

export const threadsKey = ({ chainId, boardId, blockNumber }: ThreadsQueryKeyParams) =>
  ['threads', chainId, boardId, blockNumber ? Number(blockNumber) : undefined] as const

export const threadKey = ({ chainId, boardId, threadId, blockNumber }: ThreadQueryKeyParams) =>
  ['chain', chainId, 'board', boardId, 'thread', threadId, blockNumber] as const

export const moderationServicesKey = ({ chainId, filter }: { chainId: number; filter?: string | null }) =>
  ['moderation-services', chainId, filter ?? 'all'] as const

export const moderationServiceKey = ({ chainId, address }: { chainId: number; address: string }) =>
  ['moderation-service', chainId, address] as const
