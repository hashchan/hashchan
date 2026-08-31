export interface HashchanThreadTarget {
  chainId: number
  boardId: number
  threadId: string
  atBlock?: bigint
  toBlock?: bigint
}

// Matches the path shape web/src/main.tsx routes threads under
// (/chains/:chainId/boards/:boardId/threads/:threadId), wherever it appears in
// a pasted string — a full URL, a bare path, or anything else copy/pasted
// alongside it.
const THREAD_PATH = /\/chains\/(\d+)\/boards\/(\d+)\/threads\/([^/?#\s]+)/

const parseBigIntParam = (params: URLSearchParams, name: string): bigint | undefined => {
  const raw = params.get(name)
  if (!raw) return undefined
  try {
    const value = BigInt(raw)
    return value >= 0n ? value : undefined
  } catch {
    return undefined
  }
}

// Pasted input is attacker-controllable (anyone can hand a user a crafted
// link), so anything that doesn't cleanly match degrades to null rather than
// throwing.
export const parseHashchanThreadUrl = (input: string): HashchanThreadTarget | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const match = trimmed.match(THREAD_PATH)
  if (!match) return null
  const [, chainIdRaw, boardIdRaw, threadIdRaw] = match

  // `new URL` needs an absolute URL — give it a throwaway base so a bare
  // "/chains/.../threads/...?atBlock=..." path (no origin) still parses.
  let search = ''
  try {
    search = new URL(trimmed, 'https://placeholder.invalid').search
  } catch {
    search = ''
  }
  const params = new URLSearchParams(search)

  return {
    chainId: Number(chainIdRaw),
    boardId: Number(boardIdRaw),
    threadId: decodeURIComponent(threadIdRaw),
    atBlock: parseBigIntParam(params, 'atBlock'),
    toBlock: parseBigIntParam(params, 'toBlock'),
  }
}
