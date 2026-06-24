import { useParams } from 'react-router-dom'
import { useThreads as useThreadsBase } from '@hashchan/hooks'

export const useThreads = () => {
  const { boardId, chainId } = useParams()
  return useThreadsBase(Number(boardId), Number(chainId))
}
