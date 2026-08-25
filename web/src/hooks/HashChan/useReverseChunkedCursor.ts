import { useParams, useSearchParams } from 'react-router-dom'
import { useBlockNumber } from 'wagmi'
import { useThreads as useThreadsBase } from '@hashchan/hooks'
import { parseBlockParam } from '@/utils/atBlock'

export const useReverseChunkedCursor = () => {
  const { boardId, chainId } = useParams()
  const [searchParams] = useSearchParams()
  const atBlock = parseBlockParam(searchParams.get('atBlock'))
  const {
    fetchHistory,
    canFetchHistory,
    strategy,
    historyBoundary,
    fetchForwardHistory,
    canFetchForwardHistory,
    forwardBoundary,
    scanRange,
    scannedSpans,
    scanFloor,
    blockRangeLimit,
  } = useThreadsBase(Number(boardId), Number(chainId), atBlock)
  const { data: blockNumber } = useBlockNumber({ watch: true })

  return {
    blockNumber,
    historyBoundary,
    fetchHistory,
    canFetchHistory,
    isActive: strategy === 'reverseChunked',
    forwardBoundary,
    fetchForward: fetchForwardHistory,
    canFetchForward: canFetchForwardHistory,
    isForwardActive: atBlock != null && strategy === 'reverseChunked' && canFetchForwardHistory,
    scanRange,
    scannedSpans,
    scanFloor,
    blockRangeLimit,
  }
}
