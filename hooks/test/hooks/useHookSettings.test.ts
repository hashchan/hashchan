import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useHookSettings } from '../../src/hooks/useHookSettings'
import { createTestWrapper } from '../utils/wrapper'

describe('useHookSettings', () => {
  it('seeds a default row', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useHookSettings(), { wrapper })

    await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })

    expect(result.current.hookSettings?.indexingStrategy).toBe('fullNode')
    expect(result.current.hookSettings?.blockRangeLimit).toBeGreaterThan(0)
    expect(result.current.hookSettings?.maxBlockRangeDetected).toBeNull()
    expect(result.current.hookSettings?.lastDoctorRunAt).toBeNull()
  })

  it('updates persist through the same hook instance', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useHookSettings(), { wrapper })

    await vi.waitUntil(() => result.current.hookSettings !== null, { timeout: 10_000 })

    await result.current.updateHookSettings({ indexingStrategy: 'reverseChunked', blockRangeLimit: 42 })

    await vi.waitUntil(
      () => result.current.hookSettings?.indexingStrategy === 'reverseChunked',
      { timeout: 10_000 }
    )
    expect(result.current.hookSettings?.blockRangeLimit).toBe(42)

    // restore defaults — hookSettings is shared IndexedDB state across every
    // test file in this single-forked suite
    await result.current.updateHookSettings({ indexingStrategy: 'fullNode', blockRangeLimit: 10000 })
    await vi.waitUntil(
      () => result.current.hookSettings?.indexingStrategy === 'fullNode',
      { timeout: 10_000 }
    )
  })
})
