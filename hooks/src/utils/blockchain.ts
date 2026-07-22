import { type WalletClient } from 'viem'

// Floors a computed fromBlock at a given floor (typically a contract's
// deployment block) — logs can never exist before that.
export const clampFromBlock = (candidate: bigint, floor: bigint): bigint =>
  candidate > floor ? candidate : floor

export interface ChunkedLogFilterArgs {
  address: `0x${string}`
  abi: any
  eventName: string
  args?: any
  fromBlock: bigint
  toBlock: bigint
}

// reverseChunked ONLY. Fetches logs across [fromBlock, toBlock] in
// blockRangeLimit-sized windows. HashChan assumes a power-user running their
// own node by default — fullNode/bulkScrape have no reason to chunk at all,
// however long a single unbounded call takes. blockRangeLimit (and the RPC
// doctor that detects a safe value for it) only means anything in
// reverseChunked, which is why the settings UI only shows that field there.
// Replaces tryRecurseBlockFilter: that function blindly tried the full range
// and, on failure, retried with a narrower window near the tip — which could
// silently miss older history and needed no actual knowledge of what range
// the RPC could handle. This instead always requests windows sized within
// the known-safe range from HookSettings (see useRpcDoctor), so there's
// nothing to catch or retry.
export const chunkedFetchLogs = async (
  publicClient: any,
  filterArgs: ChunkedLogFilterArgs,
  blockRangeLimit: bigint,
): Promise<any[]> => {
  if (blockRangeLimit <= 0n) {
    throw new Error('chunkedFetchLogs: blockRangeLimit must be greater than 0')
  }

  const { address, abi, eventName, args, fromBlock, toBlock } = filterArgs
  const logs: any[] = []

  for (let from = fromBlock; from <= toBlock; from += blockRangeLimit) {
    const windowEnd = from + blockRangeLimit - 1n
    const to = windowEnd > toBlock ? toBlock : windowEnd

    const filter = await publicClient.createContractEventFilter({
      address, abi, eventName, args, fromBlock: from, toBlock: to,
    })
    const chunkLogs = await publicClient.getFilterLogs({ filter })
    logs.push(...chunkLogs)
  }

  return logs
}

// fullNode/bulkScrape ONLY. A single unbounded call across the whole range —
// no chunking, since these strategies assume the RPC can handle it. It may
// just take a while on a very long-lived contract; that's expected, not a bug.
export const fetchAllLogs = async (
  publicClient: any,
  filterArgs: ChunkedLogFilterArgs,
): Promise<any[]> => {
  const { address, abi, eventName, args, fromBlock, toBlock } = filterArgs
  const filter = await publicClient.createContractEventFilter({
    address, abi, eventName, args, fromBlock, toBlock,
  })
  return publicClient.getFilterLogs({ filter })
}

export const getWalletInterface = ({
  address,
  walletClient,
}: {
  address: `0x${string}`
  walletClient: WalletClient
}) => ({
  address,
  getAddress: () => address,
  signMessage: async (message: string) => {
    const cached = localStorage.getItem(address)
    if (cached) return cached
    const signature = await walletClient.signMessage({ message, account: address })
    localStorage.setItem(address, signature)
    return signature
  },
})

export const chainIdToName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'Ethereum'
    case 10: return 'OP Mainnet'
    case 61: return 'Ethereum Classic'
    case 8453: return 'Base'
    case 11155111: return 'Sepolia'
    case 25363: return 'Fluent'
    default: return 'Unknown'
  }
}
