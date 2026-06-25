import { useState, useCallback } from 'react'
import { usePublicClient, useBlockNumber } from 'wagmi'
import { useContracts } from '@hashchan/hooks'

export type TestStatus = 'idle' | 'running' | 'pass' | 'fail'

export interface RpcDoctorResults {
  ethGetLogs: TestStatus
  ethFilterLogs: TestStatus
  maxBlockRange: number | null
  logErrors: string[]
}

const RANGE_CANDIDATES = [2_000_000, 500_000, 100_000, 50_000, 10_000, 5_000, 1_000, 100]

export const useRpcDoctor = () => {
  const publicClient = usePublicClient()
  const { data: blockNumber } = useBlockNumber()
  const { hashchan } = useContracts()

  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<RpcDoctorResults>({
    ethGetLogs: 'idle',
    ethFilterLogs: 'idle',
    maxBlockRange: null,
    logErrors: [],
  })

  const patch = (update: Partial<RpcDoctorResults>) =>
    setResults(prev => ({ ...prev, ...update }))

  const appendError = (msg: string) =>
    setResults(prev => ({ ...prev, logErrors: [...prev.logErrors, msg] }))

  const run = useCallback(async () => {
    if (!publicClient || !blockNumber || !hashchan) return
    setRunning(true)
    setResults({ ethGetLogs: 'idle', ethFilterLogs: 'idle', maxBlockRange: null, logErrors: [] })

    const toBlock = blockNumber
    const smallFrom = toBlock > 10n ? toBlock - 10n : 0n

    // ── Test 1: eth_getLogs ──────────────────────────────────────────────────
    patch({ ethGetLogs: 'running' })
    try {
      await publicClient.getLogs({
        address: hashchan.address,
        fromBlock: smallFrom,
        toBlock,
      })
      patch({ ethGetLogs: 'pass' })
    } catch (e: any) {
      patch({ ethGetLogs: 'fail' })
      appendError(`eth_getLogs: ${e?.message ?? e}`)
    }

    // ── Test 2: eth_newFilter + eth_getFilterLogs ────────────────────────────
    patch({ ethFilterLogs: 'running' })
    try {
      const filter = await publicClient.createContractEventFilter({
        address: hashchan.address,
        abi: hashchan.abi,
        fromBlock: smallFrom,
        toBlock,
      })
      await publicClient.getFilterLogs({ filter })
      patch({ ethFilterLogs: 'pass' })
    } catch (e: any) {
      patch({ ethFilterLogs: 'fail' })
      appendError(`eth_newFilter/eth_getFilterLogs: ${e?.message ?? e}`)
    }

    // ── Test 3: max block range (step-down) ──────────────────────────────────
    let found: number | null = null
    for (const range of RANGE_CANDIDATES) {
      const fromBlock = toBlock > BigInt(range) ? toBlock - BigInt(range) : 0n
      try {
        const filter = await publicClient.createContractEventFilter({
          address: hashchan.address,
          abi: hashchan.abi,
          fromBlock,
          toBlock,
        })
        await publicClient.getFilterLogs({ filter })
        found = range
        break
      } catch (e: any) {
        appendError(`range ${range.toLocaleString()}: ${e?.message ?? e}`)
      }
    }
    patch({ maxBlockRange: found })
    setRunning(false)
  }, [publicClient, blockNumber, hashchan])

  return { run, running, results }
}
