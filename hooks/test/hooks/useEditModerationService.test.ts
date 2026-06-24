import { beforeAll, describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { createPublicClient, createWalletClient, getContract, http } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { useEditModerationService } from '../../src/hooks/useEditModerationService'
import { createTestWrapper } from '../utils/wrapper'
import ModerationServiceFactoryABI from '../../src/abi/ModerationServiceFactory.json'
import ModerationServiceABI from '../../src/abi/ModerationService.json'

// Second anvil default account — used as the new janitor so it doesn't
// conflict with the one added during globalSetup.
const SECOND_JANITOR = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' as const

// Dedicated service created per test run so the pre-deployed Basic Service URI is not mutated.
let editServiceInstance: any

beforeAll(async () => {
  const rpcUrl = process.env.TEST_RPC_URL!
  const chainId = parseInt(process.env.TEST_CHAIN_ID!)
  const factoryAddress = process.env.MODERATION_SERVICE_FACTORY_ADDRESS! as `0x${string}`
  const account = privateKeyToAccount(process.env.TEST_PRIVATE_KEY! as `0x${string}`)

  const testChain = {
    id: chainId,
    name: 'test',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
  } as const

  const publicClient = createPublicClient({ chain: testChain as any, transport: http(rpcUrl) })
  const walletClient = createWalletClient({ account, chain: testChain as any, transport: http(rpcUrl) })

  const createHash = await walletClient.writeContract({
    address: factoryAddress,
    abi: ModerationServiceFactoryABI.abi,
    functionName: 'createModerationService',
    args: ['Edit Test Service', 'edit.example.com', 8080n],
    account,
  })
  await publicClient.waitForTransactionReceipt({ hash: createHash })

  const logs = await publicClient.getContractEvents({
    address: factoryAddress,
    abi: ModerationServiceFactoryABI.abi,
    eventName: 'NewModerationService',
    fromBlock: 0n,
  })
  const editAddress = logs[logs.length - 1].args.moderationService as `0x${string}`

  editServiceInstance = getContract({
    address: editAddress,
    abi: ModerationServiceABI.abi,
    client: { public: publicClient, wallet: walletClient },
  })
})

describe('useEditModerationService', () => {
  it('editUrl reaches confirmed with a URLUpdated log', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useEditModerationService(editServiceInstance), { wrapper })

    expect(result.current.status).toBe('idle')

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.editUrl('updated.example.com', 4443)
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
    const log = result.current.logs[0] as any
    expect(log.args.uri).toBe('updated.example.com')
    expect(Number(log.args.port)).toBe(4443)
  })

  it('addJanitor reaches confirmed with a NewJanitor log', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useEditModerationService(editServiceInstance), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.addJanitor(SECOND_JANITOR)
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
    const log = result.current.logs[0] as any
    expect(log.args.janitor.toLowerCase()).toBe(SECOND_JANITOR.toLowerCase())
  })

  it('reset returns hook to idle', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useEditModerationService(editServiceInstance), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.editUrl('reset.example.com', 9090)
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    result.current.reset()

    await vi.waitUntil(() => result.current.status === 'idle', { timeout: 1_000 })
    expect(result.current.hash).toBeNull()
    expect(result.current.logs).toHaveLength(0)
    expect(result.current.logErrors).toHaveLength(0)
  })
})
