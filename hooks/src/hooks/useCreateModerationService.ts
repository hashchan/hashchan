import { useState, useCallback } from 'react'
import { useConnection } from 'wagmi'

import { useContracts } from './useContracts'
import { type NewModerationServiceArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreateModerationService = () => {
  const { moderationServiceFactory } = useContracts()
  const { address } = useConnection()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [logs, setLogs] = useState<FilterLog<NewModerationServiceArgs>[]>([])
  const [logErrors, setLogErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(null)
    setLogs([])
    setLogErrors([])
  }, [])

  const createModerationService = useCallback(
    async (name: string, uri: string, port: number) => {
      const missing = checkDeps({ moderationServiceFactory, address })
      if (missing.length > 0) {
        console.debug('[hashchan] createModerationService not ready:', missing.join(', '))
        return
      }

      setStatus('submitting')

      try {
        const unwatch = moderationServiceFactory.watchEvent.NewModerationService(
          { owner: address },
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: (newLogs: FilterLog<NewModerationServiceArgs>[]) => {
              setLogs((old) => [...old, ...newLogs])
              setStatus('confirmed')
              unwatch()
            },
          }
        )

        const txHash = await moderationServiceFactory.write.createModerationService([name, uri, port])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [moderationServiceFactory, address]
  )

  return { status, hash, logs, logErrors, reset, createModerationService }
}
