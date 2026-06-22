import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateBoard } from '../../src/hooks/useCreateBoard'
import { createTestWrapper } from '../utils/wrapper'

describe('useCreateBoard', () => {
  it('creates a board and returns a tx hash', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createBoard('Test Board', 'TEST', 'A board for testing', '', ['no spam'])
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })
  })

  it('emits a NewBoard log with correct args', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateBoard(), { wrapper })

    await vi.waitUntil(async () => {
      if (!result.current.hash) {
        await result.current.createBoard('Crypto', 'CRPT', 'Crypto talk', '', [])
      }
      return !!result.current.hash
    }, { timeout: 15_000, interval: 1_000 })

    await vi.waitUntil(() => result.current.logs.length > 0, { timeout: 15_000 })
    expect(result.current.logs[0].args.name).toBe('Crypto')
  })
})
