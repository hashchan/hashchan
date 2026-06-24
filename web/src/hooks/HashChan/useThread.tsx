import { useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useThread as useThreadBase } from '@hashchan/hooks'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'

export const useThread = () => {
  const { boardId, chainId, threadId } = useParams()
  const { moderationServices, queryModerationRecords } = useContext(ModerationServicesContext)

  const base = useThreadBase(Number(boardId), Number(chainId), threadId ?? '')

  const msMsAddresses = Object.keys(moderationServices ?? {}).sort().join(',')
  const { data: janitoredMap = {} } = useQuery({
    queryKey: ['moderation', chainId, boardId, threadId, base.posts.length, msMsAddresses],
    queryFn: async () => {
      const allIds = base.posts.map((p: any) => p.postId ?? p.threadId).filter(Boolean) as string[]
      const result: Record<string, any> = {}
      await Promise.all(
        Object.values(moderationServices!).map(async (ms: any) => {
          const records = await queryModerationRecords(ms.address, allIds)
          Object.assign(result, records)
        })
      )
      return result
    },
    enabled: base.posts.length > 0 && moderationServices != null && Object.keys(moderationServices).length > 0,
    staleTime: Infinity,
  })

  return { ...base, janitoredMap }
}
