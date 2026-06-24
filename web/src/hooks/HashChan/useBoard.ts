import { useParams } from 'react-router-dom'
import { useBoard as useBoardBase } from '@hashchan/hooks'

export const useBoard = () => {
  const { boardId, chainId } = useParams()
  return useBoardBase(Number(boardId), Number(chainId))
}
