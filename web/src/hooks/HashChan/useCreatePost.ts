import { useParams } from 'react-router-dom'
import { useCreatePost as useCreatePostBase } from '@hashchan/hooks'

export const useCreatePost = () => {
  const { boardId, chainId, threadId } = useParams()
  return useCreatePostBase(Number(boardId), Number(chainId), threadId ?? '')
}
