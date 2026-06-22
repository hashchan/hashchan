import React, { useEffect } from 'react'
import { request as nodeRequest } from 'node:http'
import { WagmiProvider, createConfig, useConnect, useAccount } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { custom } from 'viem'
import { injected } from 'wagmi/connectors'
import { IDBProvider } from '../../src/provider/IDBProvider'
import HashChan3 from '../../src/abi/HashChan3.json'

// Inject the dynamically deployed test contract address so useContracts
// can find it by chain ID (the JSON only has mainnet/testnet entries).
const _testChainId = process.env.TEST_CHAIN_ID
const _testAddress = process.env.HASHCHAN3_ADDRESS
if (_testChainId && _testAddress) {
  ;(HashChan3 as any)[_testChainId] = { address: _testAddress }
}

// Use node:http instead of fetch so happy-dom's Same Origin Policy
// doesn't block requests to the local test node.
function createTestEip1193(rpcUrl: string) {
  const url = new URL(rpcUrl)

  function rpcCall(method: string, params: unknown[] = []): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const body = JSON.stringify({ jsonrpc: '2.0', method, params, id: Date.now() })
      const req = nodeRequest(
        {
          hostname: url.hostname,
          port: parseInt(url.port),
          path: url.pathname || '/',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
          },
        },
        (res) => {
          let data = ''
          res.on('data', (chunk: string) => { data += chunk })
          res.on('end', () => {
            try {
              const { result, error } = JSON.parse(data)
              if (error) reject(new Error(error.message))
              else resolve(result)
            } catch (e) { reject(e) }
          })
        }
      )
      req.on('error', reject)
      req.write(body)
      req.end()
    })
  }

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

export function createTestWrapper() {
  const rpcUrl = process.env.TEST_RPC_URL!
  const chainId = parseInt(process.env.TEST_CHAIN_ID!)

  const testChain = {
    id: chainId,
    name: 'test',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  } as const

  const provider = createTestEip1193(rpcUrl)
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
