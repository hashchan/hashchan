import { execSync } from 'child_process'
import { resolve } from 'path'
import { createPublicClient, createWalletClient, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import HashChan3 from '../src/abi/HashChan3.json'

const NODE = (process.env.TEST_NODE ?? 'anvil') as 'anvil' | 'geth'

const NODES = {
  anvil: { rpcUrl: 'http://127.0.0.1:8545', chainId: 31337 },
  geth:  { rpcUrl: 'http://127.0.0.1:8546', chainId: 1337  },
}

// Anvil's first default pre-funded key — we fund this account on geth too
const TEST_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const

const COMPOSE_FILE = resolve(__dirname, '../../docker/docker-compose.yml')

async function rpcCall(url: string, method: string, params: unknown[] = []) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  })
  const { result, error } = await res.json()
  if (error) throw new Error(`${method} failed: ${error.message}`)
  return result
}

async function waitForRpc(url: string, timeout = 30_000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      await rpcCall(url, 'eth_blockNumber')
      return
    } catch {}
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`${url} not ready after ${timeout}ms — is the docker service running?`)
}

export async function setup() {
  const { rpcUrl, chainId } = NODES[NODE]

  console.log(`\n▶ starting ${NODE}...`)
  try {
    execSync(`docker compose --profile ${NODE} -f ${COMPOSE_FILE} up -d`, { stdio: 'inherit' })
  } catch (e) {
    throw new Error(
      `Failed to start ${NODE} via docker compose.\n` +
      `Make sure docker is running and the compose file is valid.\n` +
      `Compose file: ${COMPOSE_FILE}\n` +
      `Original error: ${(e as Error).message}`
    )
  }
  await waitForRpc(rpcUrl)
  console.log(`✓ ${NODE} ready at ${rpcUrl} (chainId ${chainId})`)

  const testChain = {
    id: chainId,
    name: 'test',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  } as const

  const account = privateKeyToAccount(TEST_KEY)
  const transport = http(rpcUrl)
  const publicClient = createPublicClient({ chain: testChain, transport })
  const walletClient = createWalletClient({ account, chain: testChain, transport })

  // Geth dev mode pre-funds a random coinbase — send 1 ETH to our test account
  if (NODE === 'geth') {
    const [devAccount] = await rpcCall(rpcUrl, 'eth_accounts')
    if (devAccount) {
      await rpcCall(rpcUrl, 'eth_sendTransaction', [{
        from: devAccount,
        to: account.address,
        value: '0xDE0B6B3A7640000', // 1 ETH
      }])
      await new Promise((r) => setTimeout(r, 1500)) // wait for the block
    }
  }

  const deployHash = await walletClient.deployContract({
    abi: HashChan3.abi,
    bytecode: HashChan3.bytecode as `0x${string}`,
    account,
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: deployHash })
  console.log(`✓ HashChan3 deployed at ${receipt.contractAddress}`)

  // Expose to test processes via env
  process.env.TEST_NODE_TYPE     = NODE
  process.env.TEST_RPC_URL       = rpcUrl
  process.env.TEST_CHAIN_ID      = String(chainId)
  process.env.TEST_PRIVATE_KEY   = TEST_KEY
  process.env.HASHCHAN3_ADDRESS  = receipt.contractAddress!
}

export async function teardown() {
  const node = process.env.TEST_NODE_TYPE ?? process.env.TEST_NODE ?? 'anvil'
  console.log(`\n▶ stopping ${node}...`)
  try {
    execSync(`docker compose --profile ${node} -f ${COMPOSE_FILE} down`, { stdio: 'inherit' })
  } catch {
    console.warn(`docker compose down exited non-zero — container may already be stopped`)
  }
}
