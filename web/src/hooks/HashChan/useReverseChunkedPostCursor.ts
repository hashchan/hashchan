import { useParams } from 'react-router-dom'
import { useBlockNumber } from 'wagmi'
import { useThread as useThreadBase } from '@hashchan/hooks'

export const useReverseChunkedPostCursor = () => {
  const { boardId, chainId, threadId } = useParams()
  const { fetchHistory, canFetchHistory, strategy, historyBoundary } = useThreadBase(
    Number(boardId),
    Number(chainId),
    threadId ?? ''
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
