import { useParams } from 'react-router-dom'
import { useCreateThread as useCreateThreadBase } from '@hashchan/hooks'

export const useCreateThread = () => {
  const { boardId, chainId } = useParams()
  return useCreateThreadBase(Number(boardId), Number(chainId))
}
