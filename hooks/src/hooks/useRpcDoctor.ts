import { useState, useCallback } from 'react'
import { usePublicClient, useBlockNumber } from 'wagmi'
import { useContracts } from './useContracts'
import { useHookSettings } from './useHookSettings'
import { detectRpcCapabilities, IDLE_RESULTS, type RpcDoctorResults } from '../utils/rpcDoctor'

// Local constant — the hooks package doesn't rely on a global Math.PHI (that's
// a UI-layer convention set up by the web/extension apps, not guaranteed here).
const PHI = (1 + Math.sqrt(5)) / 2

export const useRpcDoctor = () => {
  const publicClient = usePublicClient()
  const { data: blockNumber } = useBlockNumber()
  const { hashchan } = useContracts()
  const { updateHookSettings } = useHookSettings()

  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<RpcDoctorResults>(IDLE_RESULTS)

  const run = useCallback(async () => {
    if (!publicClient || !blockNumber || !hashchan) return
    setRunning(true)
    setResults(IDLE_RESULTS)

    // detectRpcCapabilities calls this after every individual test (and every
    // range step-down attempt) resolves, so the modal fills in pass/fail and
    // each range's error live instead of going blank until the whole,
    // potentially many-call, step-down finishes.
    const found = await detectRpcCapabilities(publicClient, hashchan, blockNumber, setResults)
    setRunning(false)

    // Auto-apply the detected safe range instead of requiring a separate
    // manual "apply" step — the whole point of running the doctor is to keep
    // chunkedFetchLogs calls sized within what this RPC actually handles.
    if (found.maxBlockRange != null) {
      // Floor of 1 — an RPC that only tolerates 1-block ranges still needs a
      // usable (if slow) blockRangeLimit, not a 0 that stalls chunked scans.
      const safe = Math.max(1, Math.floor(found.maxBlockRange * (1 / PHI + 1 / PHI ** 3)))
      await updateHookSettings({
        blockRangeLimit: safe,
        maxBlockRangeDetected: found.maxBlockRange,
        lastDoctorRunAt: Date.now(),
      })
    }
  }, [publicClient, blockNumber, hashchan, updateHookSettings])

  return { run, running, results }
}
