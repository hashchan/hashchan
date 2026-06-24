import { useState, useCallback, useMemo } from 'react'

export interface BlockCursor {
  page: number
  fromBlock: bigint | undefined
  toBlock: bigint | undefined
  goBack: () => void
  goForward: () => void
  reset: () => void
  canGoBack: boolean
  canGoForward: boolean
}

export const useBlockCursor = (
  currentBlock: bigint | undefined,
  blockRangeLimit: bigint
): BlockCursor => {
  const [page, setPage] = useState(0)

  const { fromBlock, toBlock } = useMemo(() => {
    if (currentBlock === undefined) return { fromBlock: undefined, toBlock: undefined }
    const to = currentBlock - BigInt(page) * blockRangeLimit
    const from = to > blockRangeLimit ? to - blockRangeLimit : 0n
    return { fromBlock: from, toBlock: to }
  }, [currentBlock, blockRangeLimit, page])

  const goBack    = useCallback(() => setPage((p) => p + 1), [])
  const goForward = useCallback(() => setPage((p) => Math.max(0, p - 1)), [])
  const reset     = useCallback(() => setPage(0), [])

  return {
    page,
    fromBlock,
    toBlock,
    canGoBack:    fromBlock !== undefined && fromBlock > 0n,
    canGoForward: page > 0,
    goBack,
    goForward,
    reset,
  }
}
