import { useEffect } from 'react'

// Only undefined/null count as "missing" — legitimate falsy values like 0, 0n,
// false, or '' (e.g. hashchanDeployedAtBlock resolving to 0n on a test chain
// whose contract has no known deployment block) must not be treated as unready.
export function checkDeps(deps: Record<string, unknown>): string[] {
  return Object.entries(deps)
    .filter(([, v]) => v === undefined || v === null)
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
