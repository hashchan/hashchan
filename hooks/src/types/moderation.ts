export interface JanitorData {
  janitor: `0x${string}`
  positiveReviews: bigint
  negativeReviews: bigint
  started: bigint
  claimedWages: bigint
}

export interface ModerationServiceData {
  owner: `0x${string}`
  address: `0x${string}`
  name: string
  uri: string
  port: number
  positives: bigint
  negatives: bigint
  totalWages: bigint
  instance: any
  janitors?: JanitorData[]
  subscribed?: number
  orbitDbAddr?: string
}
