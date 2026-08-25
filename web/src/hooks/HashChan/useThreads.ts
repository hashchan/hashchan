import { useParams, useSearchParams } from 'react-router-dom'
import { useThreads as useThreadsBase } from '@hashchan/hooks'
import { parseBlockParam } from '@/utils/atBlock'

export const useThreads = () => {
  const { boardId, chainId } = useParams()
  const [searchParams] = useSearchParams()
  const atBlock = parseBlockParam(searchParams.get('atBlock'))
  return useThreadsBase(Number(boardId), Number(chainId), atBlock)
}
