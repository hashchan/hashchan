import { useParams } from 'react-router-dom'
import { useBookmarkedPosts as useBookmarkedPostsBase } from '@hashchan/hooks'

export const useBookmarkedPosts = () => {
  const { boardId, chainId } = useParams()
  return useBookmarkedPostsBase(Number(boardId), Number(chainId))
}
