// Parses a block-number query param shared into a thread/board link
// (?atBlock=, ?toBlock=). It's attacker-controllable (comes straight from a
// URL), so a malformed value must degrade to "no hint" rather than crash the
// route.
export const parseBlockParam = (raw: string | null): bigint | undefined => {
  if (!raw) return undefined
  try {
    const value = BigInt(raw)
    return value >= 0n ? value : undefined
  } catch {
    return undefined
  }
}
