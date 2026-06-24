import { useContext } from 'react'
import { HeliaContext } from '@/provider/HeliaProvider'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'
import { useJoinModerationService as useJoinBase } from '@hashchan/hooks'
import type { ModerationService } from '@hashchan/hooks'

export const useJoinModerationService = (ms: ModerationService | null | undefined) => {
  const { helia } = useContext(HeliaContext)
  const { addPubsubHandle } = useContext(ModerationServicesContext)
  return useJoinBase(ms, helia, addPubsubHandle)
}
