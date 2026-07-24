// Pulls the CID back out of a rendered imgUrl, whatever form it's in — a
// bare CID (no gateway was set when it was pinned), our own providers'
// path-style gateway URLs (.../ipfs/<cid>, used by both useKuboPin.ts and
// useFilebasePin.ts), or Storacha's subdomain-style URLs
// (<cid>.ipfs.storacha.link). Returns null for anything else (an arbitrary
// external image), so callers know to fall back to fetching the bytes
// instead of asking a pinning provider to fetch-by-CID.
export function extractCid(imgUrl: string): string | null {
  if (!/^https?:\/\//.test(imgUrl)) {
    return imgUrl || null
  }

  try {
    const url = new URL(imgUrl)

    const pathMatch = url.pathname.match(/\/ipfs\/([^/?#]+)/)
    if (pathMatch) return pathMatch[1]

    const hostMatch = url.hostname.match(/^([^.]+)\.ipfs\./)
    if (hostMatch) return hostMatch[1]
  } catch {
    return null
  }

  return null
}
