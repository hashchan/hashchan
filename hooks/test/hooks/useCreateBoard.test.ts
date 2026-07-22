import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { useBoard } from '../../src/hooks/useBoard'
import { createTestWrapper } from '../utils/wrapper'

const CHAIN_ID = parseInt(process.env.TEST_CHAIN_ID ?? '31337')

describe('useCreateBoard', () => {
  it('starts idle, reaches confirmed after createBoard', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    expect(result.current.status).toBe('idle')

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createBoard('Test Board', 'TEST', 'A board for testing', '', ['no spam'])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
  })

  it('emits a NewBoard log with correct args', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createBoard('Crypto', 'CRPT', 'Crypto talk', '', [])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.logs[0].args.name).toBe('Crypto')
    expect(result.current.logs[0].args.symbol).toBe('CRPT')
  })

  it('persists blockCreatedAt on the created board', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createBoard('Block Board', 'BLK', 'testing blockCreatedAt', '', [])
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    const boardId = Number(result.current.logs[0].args.boardId)
    const expectedBlock = Number(result.current.logs[0].blockNumber)

    const { result: boardResult } = renderHook(() => useBoard(boardId, CHAIN_ID), { wrapper })
    await vi.waitUntil(() => !!boardResult.current.board, { timeout: 15_000 })

    expect(boardResult.current.board!.blockCreatedAt).toBe(expectedBlock)
  })

  it('reset returns hook to idle', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createBoard('ResetBoard', 'RST', 'will be reset', '', [])
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
