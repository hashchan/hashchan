import { useParams } from 'react-router-dom'
import { useBlockNumber } from 'wagmi'
import { useThreads as useThreadsBase } from '@hashchan/hooks'

export const useReverseChunkedCursor = () => {
  const { boardId, chainId } = useParams()
  const { fetchHistory, canFetchHistory, strategy, historyBoundary } = useThreadsBase(
    Number(boardId),
    Number(chainId)
  )
  const { data: blockNumber } = useBlockNumber({ watch: true })

  return {
    blockNumber,
    historyBoundary,
    fetchHistory,
    canFetchHistory,
    isActive: strategy === 'reverseChunked',
  }
}
