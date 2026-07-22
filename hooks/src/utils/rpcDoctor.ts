export type RpcDoctorTestStatus = 'idle' | 'running' | 'pass' | 'fail'

export interface RpcDoctorResults {
  ethGetLogs: RpcDoctorTestStatus
  ethFilterLogs: RpcDoctorTestStatus
  maxBlockRange: number | null
  logErrors: string[]
}

const RANGE_CANDIDATES = [2_000_000, 500_000, 100_000, 50_000, 10_000, 5_000, 1_000, 100]

// Step-downs through RANGE_CANDIDATES calling createContractEventFilter +
// getFilterLogs until one succeeds, to find the largest block range this RPC
// reliably handles per call. Ported from web/src/hooks/useRpcDoctor.ts so it's
// shared (and testable against the real local anvil/geth node) rather than
// living only in the web app.
export async function detectRpcCapabilities(
  publicClient: any,
  contract: { address: `0x${string}`; abi: any },
  toBlock: bigint,
): Promise<RpcDoctorResults> {
  const results: RpcDoctorResults = {
    ethGetLogs: 'idle',
    ethFilterLogs: 'idle',
    maxBlockRange: null,
    logErrors: [],
  }

  const smallFrom = toBlock > 10n ? toBlock - 10n : 0n

  // Test 1: eth_getLogs
  results.ethGetLogs = 'running'
  try {
    await publicClient.getLogs({
      address: contract.address,
      fromBlock: smallFrom,
      toBlock,
    })
    results.ethGetLogs = 'pass'
  } catch (e: any) {
    results.ethGetLogs = 'fail'
    results.logErrors.push(`eth_getLogs: ${e?.message ?? e}`)
  }

  // Test 2: eth_newFilter + eth_getFilterLogs
  results.ethFilterLogs = 'running'
  try {
    const filter = await publicClient.createContractEventFilter({
      address: contract.address,
      abi: contract.abi,
      fromBlock: smallFrom,
      toBlock,
    })
    await publicClient.getFilterLogs({ filter })
    results.ethFilterLogs = 'pass'
  } catch (e: any) {
    results.ethFilterLogs = 'fail'
    results.logErrors.push(`eth_newFilter/eth_getFilterLogs: ${e?.message ?? e}`)
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
      results.maxBlockRange = range
      break
    } catch (e: any) {
      results.logErrors.push(`range ${range.toLocaleString()}: ${e?.message ?? e}`)
    }
  }

  return results
}
