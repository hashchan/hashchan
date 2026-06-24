import { useState, useCallback } from 'react'
import { useConnection } from 'wagmi'

import { type NewJanitorArgs, type OwnershipTransferredArgs, type URLUpdatedArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

type EditLog = FilterLog<NewJanitorArgs | OwnershipTransferredArgs | URLUpdatedArgs>

export const useEditModerationService = (instance: any) => {
  const { address } = useConnection()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [logs, setLogs] = useState<EditLog[]>([])
  const [logErrors, setLogErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(null)
    setLogs([])
    setLogErrors([])
  }, [])

  const editUrl = useCallback(
    async (uri: string, port: number) => {
      const missing = checkDeps({ instance, address })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const unwatch = instance.watchEvent.URLUpdated(
          {},
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: (newLogs: FilterLog<URLUpdatedArgs>[]) => {
              setLogs((old) => [...old, ...newLogs])
              setStatus('confirmed')
              unwatch()
            },
          }
        )
        const txHash = await instance.write.setURL([uri, port])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [instance, address]
  )

  const addJanitor = useCallback(
    async (janitor: `0x${string}`) => {
      const missing = checkDeps({ instance, address })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const unwatch = instance.watchEvent.NewJanitor(
          { janitor },
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: (newLogs: FilterLog<NewJanitorArgs>[]) => {
              setLogs((old) => [...old, ...newLogs])
              setStatus('confirmed')
              unwatch()
            },
          }
        )
        const txHash = await instance.write.addJanitor([janitor])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [instance, address]
  )

  const transferOwnership = useCallback(
    async (newOwner: `0x${string}`) => {
      const missing = checkDeps({ instance, address })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const unwatch = instance.watchEvent.OwnershipTransferred(
          { newOwner },
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: (newLogs: FilterLog<OwnershipTransferredArgs>[]) => {
              setLogs((old) => [...old, ...newLogs])
              setStatus('confirmed')
              unwatch()
            },
          }
        )
        const txHash = await instance.write.transferOwnership([newOwner])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [instance, address]
  )

  return { status, hash, logs, logErrors, reset, editUrl, addJanitor, transferOwnership }
}
