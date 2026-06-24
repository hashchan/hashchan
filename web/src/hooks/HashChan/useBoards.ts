import { useConnection } from 'wagmi'
import { useBoards as useBoardsBase } from '@hashchan/hooks'

export const useBoards = () => {
  const { chainId } = useConnection()
  const result = useBoardsBase(chainId ?? 0)
  return {
    ...result,
    favouriteBoards: result.boards.filter(b => b.favourite === 1),
  }
}
