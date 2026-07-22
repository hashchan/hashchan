import { useState, useCallback } from 'react'
import { useConnection, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'

import { useContracts } from './useContracts'
import { type NewModerationServiceArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreateModerationService = () => {
  const { moderationServiceFactory } = useContracts()
  const { address } = useConnection()
  const publicClient = usePublicClient()

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
      const missing = checkDeps({ moderationServiceFactory, address, publicClient })
      if (missing.length > 0) {
        console.debug('[hashchan] createModerationService not ready:', missing.join(', '))
        return
      }

      setStatus('submitting')

      try {
        const txHash = await moderationServiceFactory.write.createModerationService([name, uri, port])
        setHash(txHash)
        setStatus('pending')

        // Decode straight from this transaction's own receipt instead of a
        // watchEvent race matched only by owner, which could also match
        // another service the same account creates around the same time.
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const newLogs = parseEventLogs({
          abi: moderationServiceFactory.abi,
          eventName: 'NewModerationService',
          logs: receipt.logs,
        }) as unknown as FilterLog<NewModerationServiceArgs>[]

        if (newLogs.length === 0) {
          setLogErrors((old) => [...old, 'NewModerationService event not found in transaction receipt'])
          setStatus('error')
          return
        }

        setLogs((old) => [...old, ...newLogs])
        setStatus('confirmed')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [moderationServiceFactory, address, publicClient]
  )

  return { status, hash, logs, logErrors, reset, createModerationService }
}
