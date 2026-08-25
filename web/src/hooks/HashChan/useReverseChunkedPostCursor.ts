import { useParams, useSearchParams } from 'react-router-dom'
import { useBlockNumber } from 'wagmi'
import { useThread as useThreadBase } from '@hashchan/hooks'
import { parseBlockParam } from '@/utils/atBlock'

export const useReverseChunkedPostCursor = () => {
  const { boardId, chainId, threadId } = useParams()
  const [searchParams] = useSearchParams()
  const atBlock = parseBlockParam(searchParams.get('atBlock'))
  const toBlock = parseBlockParam(searchParams.get('toBlock'))
  const {
    fetchHistory,
    canFetchHistory,
    strategy,
    historyBoundary,
    fetchForward,
    canFetchForward,
    forwardBoundary,
    scanRange,
    scannedSpans,
    scanFloor,
    blockRangeLimit,
  } = useThreadBase(Number(boardId), Number(chainId), threadId ?? '', atBlock, toBlock)
  const { data: blockNumber } = useBlockNumber({ watch: true })

  return {
    blockNumber,
    historyBoundary,
    fetchHistory,
    canFetchHistory,
    isActive: strategy === 'reverseChunked',
    forwardBoundary,
    fetchForward,
    canFetchForward,
    isForwardActive: atBlock != null && strategy === 'reverseChunked' && canFetchForward,
    scanRange,
    scannedSpans,
    scanFloor,
    blockRangeLimit,
  }
}
