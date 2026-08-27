export type RpcDoctorTestStatus = 'idle' | 'running' | 'pass' | 'fail'

export interface RpcDoctorResults {
  ethGetLogs: RpcDoctorTestStatus
  ethFilterLogs: RpcDoctorTestStatus
  maxBlockRange: number | null
  logErrors: string[]
}

export const IDLE_RESULTS: RpcDoctorResults = {
  ethGetLogs: 'idle',
  ethFilterLogs: 'idle',
  maxBlockRange: null,
  logErrors: [],
}

// Many public RPCs cap eth_getLogs/getFilterLogs way below the old floor of
// 100 blocks — some as low as 5-10 — so the step-down has to actually probe
// that far or affected users silently land on a range their RPC still rejects.
const RANGE_CANDIDATES = [2_000_000, 500_000, 100_000, 50_000, 10_000, 5_000, 1_000, 500, 100, 10, 5, 1]

// Step-downs through RANGE_CANDIDATES calling createContractEventFilter +
// getFilterLogs until one succeeds, to find the largest block range this RPC
// reliably handles per call. Ported from web/src/hooks/useRpcDoctor.ts so it's
// shared (and testable against the real local anvil/geth node) rather than
// living only in the web app.
//
// Reports each test's outcome via onUpdate as soon as it's known, rather than
// only returning once the whole (potentially 12-call) step-down finishes —
// against a slow/rate-limited public RPC that step-down alone can take many
// seconds, and a UI that goes silent for that whole span reads as hung.
export async function detectRpcCapabilities(
  publicClient: any,
  contract: { address: `0x${string}`; abi: any },
  toBlock: bigint,
  onUpdate?: (results: RpcDoctorResults) => void,
): Promise<RpcDoctorResults> {
  let results: RpcDoctorResults = { ...IDLE_RESULTS, logErrors: [] }
  const emit = (patch: Partial<RpcDoctorResults>) => {
    results = { ...results, ...patch }
    onUpdate?.(results)
  }
  const pushError = (message: string) => emit({ logErrors: [...results.logErrors, message] })

  const smallFrom = toBlock > 10n ? toBlock - 10n : 0n

  // Test 1: eth_getLogs
  emit({ ethGetLogs: 'running' })
  try {
    await publicClient.getLogs({
      address: contract.address,
      fromBlock: smallFrom,
      toBlock,
    })
    emit({ ethGetLogs: 'pass' })
  } catch (e: any) {
    emit({ ethGetLogs: 'fail' })
    pushError(`eth_getLogs: ${e?.message ?? e}`)
  }

  // Test 2: eth_newFilter + eth_getFilterLogs
  emit({ ethFilterLogs: 'running' })
  try {
    const filter = await publicClient.createContractEventFilter({
      address: contract.address,
      abi: contract.abi,
      fromBlock: smallFrom,
      toBlock,
    })
    await publicClient.getFilterLogs({ filter })
    emit({ ethFilterLogs: 'pass' })
  } catch (e: any) {
    emit({ ethFilterLogs: 'fail' })
    pushError(`eth_newFilter/eth_getFilterLogs: ${e?.message ?? e}`)
  }

  // Test 3: max block range (step-down)
  for (const range of RANGE_CANDIDATES) {
    const fromBlock = toBlock > BigInt(range) ? toBlock - BigInt(range) : 0n
    try {
      const filter = await publicClient.createContractEventFilter({
        address: contract.address,
        abi: contract.abi,
        fromBlock,
        toBlock,
      })
      await publicClient.getFilterLogs({ filter })
      emit({ maxBlockRange: range })
      break
    } catch (e: any) {
      pushError(`range ${range.toLocaleString()}: ${e?.message ?? e}`)
    }
  }

  return results
}
