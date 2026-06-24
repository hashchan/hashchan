import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCreateModerationService } from '../../src/hooks/useCreateModerationService'
import { createTestWrapper } from '../utils/wrapper'

describe('useCreateModerationService', () => {
  it('starts idle, reaches confirmed after createModerationService', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateModerationService(), { wrapper })

    expect(result.current.status).toBe('idle')

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createModerationService('Test Mod Service', 'mod.example.com', 8080)
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.hash).toBeTruthy()
    expect(result.current.logErrors).toHaveLength(0)
  })

  it('emits a NewModerationService log with the correct name', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateModerationService(), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createModerationService('Named Service', 'named.example.com', 443)
      }
      return result.current.status === 'confirmed'
    }, { timeout: 15_000, interval: 1_000 })

    expect(result.current.logs[0].args.name).toBe('Named Service')
    expect(result.current.logs[0].args.moderationService).toMatch(/^0x/)
  })

  it('reset returns hook to idle', async () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useCreateModerationService(), { wrapper })

    await vi.waitUntil(async () => {
      if (result.current.status === 'idle') {
        await result.current.createModerationService('Reset Service', 'reset.example.com', 443)
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
