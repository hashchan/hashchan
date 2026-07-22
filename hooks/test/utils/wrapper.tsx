import React, { useEffect } from 'react'
import { WagmiProvider, createConfig, useConnect, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { custom } from 'viem'
import { injected } from 'wagmi/connectors'
import { IDBProvider } from '../../src/provider/IDBProvider'
import { createRpcCall } from './rpc'
import HashChan3 from '../../src/abi/HashChan3.json'
import ModerationServiceFactory from '../../src/abi/ModerationServiceFactory.json'

// Inject dynamically deployed test contract addresses so useContracts
// can find them by chain ID (the JSON only has mainnet/testnet entries).
const _testChainId = process.env.TEST_CHAIN_ID
const _testAddress = process.env.HASHCHAN3_ADDRESS
if (_testChainId && _testAddress) {
  ;(HashChan3 as any)[_testChainId] = { address: _testAddress }
}
const _msfAddress = process.env.MODERATION_SERVICE_FACTORY_ADDRESS
if (_testChainId && _msfAddress) {
  ;(ModerationServiceFactory as any)[_testChainId] = { address: _msfAddress }
}

// Use node:http instead of fetch so happy-dom's Same Origin Policy
// doesn't block requests to the local test node.
function createTestEip1193(rpcUrl: string, options: { maxBlockRange?: number } = {}) {
  const rpcCall = createRpcCall(rpcUrl)
  const { maxBlockRange } = options

  return {
    async request({ method, params = [] }: { method: string; params?: unknown[] }) {
      // geth dev mode doesn't implement eth_requestAccounts — map it to eth_accounts
      const rpcMethod = method === 'eth_requestAccounts' ? 'eth_accounts' : method
      let rpcParams = params as unknown[]
      // geth eth_getLogs with no fromBlock defaults to latest block only,
      // missing historical events. Default to genesis so it matches mainnet behaviour.
      if (rpcMethod === 'eth_getLogs' && Array.isArray(rpcParams) && rpcParams[0] && typeof rpcParams[0] === 'object') {
        const filter = rpcParams[0] as Record<string, unknown>
        if (filter.fromBlock === undefined) {
          rpcParams = [{ ...filter, fromBlock: '0x0' }]
        }
      }

      // Simulates a range-limited RPC provider (e.g. Infura's free-tier 10k
      // block cap) by rejecting eth_newFilter/eth_getLogs calls whose
      // fromBlock..toBlock span exceeds maxBlockRange — the exact real-world
      // failure mode chunkedFetchLogs exists to work around.
      if (
        maxBlockRange != null &&
        (rpcMethod === 'eth_newFilter' || rpcMethod === 'eth_getLogs') &&
        Array.isArray(rpcParams) &&
        rpcParams[0] &&
        typeof rpcParams[0] === 'object'
      ) {
        const filter = rpcParams[0] as Record<string, unknown>
        const fromBlock = typeof filter.fromBlock === 'string' ? parseInt(filter.fromBlock, 16) : 0
        const toBlockRaw = filter.toBlock
        if (typeof toBlockRaw === 'string' && toBlockRaw !== 'latest') {
          const toBlock = parseInt(toBlockRaw, 16)
          if (toBlock - fromBlock > maxBlockRange) {
            throw new Error(`query returned more than ${maxBlockRange} results. Try with this block range: [${filter.fromBlock}, 0x${(fromBlock + maxBlockRange).toString(16)}]`)
          }
        }
      }

      return rpcCall(rpcMethod, rpcParams)
    },
    on() {},
    removeListener() {},
  }
}

function AutoConnect() {
  const { connect, connectors } = useConnect()
  const { isConnected } = useAccount()
  useEffect(() => {
    if (!isConnected && connectors[0]) {
      connect({ connector: connectors[0] })
    }
  }, [isConnected, connect, connectors])
  return null
}

export function createTestWrapper(options: { maxBlockRange?: number } = {}) {
  const rpcUrl = process.env.TEST_RPC_URL!
  const chainId = parseInt(process.env.TEST_CHAIN_ID!)

  const testChain = {
    id: chainId,
    name: 'test',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  } as const

  const provider = createTestEip1193(rpcUrl, options)
  // Wagmi's injected connector reads window.ethereum
  ;(globalThis as any).window = globalThis
  ;(globalThis as any).ethereum = provider

  const config = createConfig({
    chains: [testChain as any],
    transports: { [chainId]: custom(provider) },
    connectors: [injected()],
    pollingInterval: 200,
  })

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <IDBProvider>
            <AutoConnect />
            {children}
          </IDBProvider>
        </QueryClientProvider>
      </WagmiProvider>
    )
  }
}
