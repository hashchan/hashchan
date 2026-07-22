import { useState, useCallback } from 'react'
import { useConnection, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'

import { type NewJanitorArgs, type OwnershipTransferredArgs, type URLUpdatedArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

type EditLog = FilterLog<NewJanitorArgs | OwnershipTransferredArgs | URLUpdatedArgs>

export const useEditModerationService = (instance: any) => {
  const { address } = useConnection()
  const publicClient = usePublicClient()

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
      const missing = checkDeps({ instance, address, publicClient })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const txHash = await instance.write.setURL([uri, port])
        setHash(txHash)
        setStatus('pending')

        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const newLogs = parseEventLogs({
          abi: instance.abi,
          eventName: 'URLUpdated',
          logs: receipt.logs,
        }) as unknown as FilterLog<URLUpdatedArgs>[]

        if (newLogs.length === 0) {
          setLogErrors((old) => [...old, 'URLUpdated event not found in transaction receipt'])
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
    [instance, address, publicClient]
  )

  const addJanitor = useCallback(
    async (janitor: `0x${string}`) => {
      const missing = checkDeps({ instance, address, publicClient })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const txHash = await instance.write.addJanitor([janitor])
        setHash(txHash)
        setStatus('pending')

        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const newLogs = parseEventLogs({
          abi: instance.abi,
          eventName: 'NewJanitor',
          logs: receipt.logs,
        }) as unknown as FilterLog<NewJanitorArgs>[]

        if (newLogs.length === 0) {
          setLogErrors((old) => [...old, 'NewJanitor event not found in transaction receipt'])
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
    [instance, address, publicClient]
  )

  const transferOwnership = useCallback(
    async (newOwner: `0x${string}`) => {
      const missing = checkDeps({ instance, address, publicClient })
      if (missing.length > 0) return

      setStatus('submitting')
      try {
        const txHash = await instance.write.transferOwnership([newOwner])
        setHash(txHash)
        setStatus('pending')

        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const newLogs = parseEventLogs({
          abi: instance.abi,
          eventName: 'OwnershipTransferred',
          logs: receipt.logs,
        }) as unknown as FilterLog<OwnershipTransferredArgs>[]

        if (newLogs.length === 0) {
          setLogErrors((old) => [...old, 'OwnershipTransferred event not found in transaction receipt'])
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
    [instance, address, publicClient]
  )

  return { status, hash, logs, logErrors, reset, editUrl, addJanitor, transferOwnership }
}
