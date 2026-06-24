import { useEffect } from 'react'

export function checkDeps(deps: Record<string, unknown>): string[] {
  return Object.entries(deps)
    .filter(([, v]) => !v)
    .map(([k]) => k)
}

export function useEnabled(deps: Record<string, unknown>): boolean {
  const missing = checkDeps(deps)
  const missingKey = missing.join(',')

  useEffect(() => {
    if (missing.length > 0) {
      console.debug('[hashchan] waiting on:', missing.join(', '))
    }
  }, [missingKey])

  return missing.length === 0
}
