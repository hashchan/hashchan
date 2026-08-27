import { createContext, useEffect, useState } from 'react'
import Dexie, { type EntityTable } from 'dexie'
import { type Span } from '../utils/spans'

export type IndexingStrategy = 'fullNode' | 'reverseChunked' | 'bulkScrape'

export interface Settings {
  id?: number
  tosAccepted: boolean
  tosTimestamp: number
  defaultTipAmount: string
}

export interface HookSettings {
  id?: number
  indexingStrategy: IndexingStrategy
  // doctor-populated: the largest block range this RPC reliably handles per call
  blockRangeLimit: number
  // last successful useRpcDoctor run's detected safe range, for display/reference
  maxBlockRangeDetected: number | null
  lastDoctorRunAt: number | null
}

export interface Board {
  id?: number
  // Derived compat field, always kept equal to liveSpan(scannedSpans)?.toBlock
  // ?? 0 — CacheFlusher.tsx and the board-record initializers still read/set
  // this directly, so it's not just dropped in favor of scannedSpans alone.
  lastSynced: number
  // Sparse set of block ranges already known to be fully scanned. Replaces
  // the old single scanBoundary scalar, which could only represent one
  // contiguous region growing from the tip — an atBlock-anchored forward
  // scan can create a second, disjoint region before it merges with the
  // tip-tailed one. See utils/spans.ts.
  scannedSpans: Span[]
  blockCreatedAt?: number
  chainId: number
  boardId: number
  name: string
  symbol: string
  description: string
  bannerUrl: string
  bannerCID: string
  rules: string[]
  favourite: number
  metadata: {
    stats: {
      threadCount: number
      postCount: number
    }
  }
}

export interface Thread {
  id?: number
  // See Board.lastSynced — same derived-compat-field treatment.
  lastSynced: number
  // See Board.scannedSpans.
  scannedSpans: Span[]
  blockCreatedAt?: number
  bookmarked: number
  boardId: number
  threadId: string
  creator: `0x${string}`
  imgUrl: string
  imgCID: string
  title: string
  content: string
  timestamp: number
  chainId: number
}

export interface Post {
  id?: number
  boardId: number
  threadId: string
  postId: string
  creator: `0x${string}`
  imgUrl: string
  imgCID: string
  bookmarked: number
  replyIds: string[]
  content: string
  timestamp: number
}

export interface ModerationService {
  id?: number
  subscribed: number
  uri: string
  port: number
  name: string
  address: `0x${string}`
  chainId: number
  owner: `0x${string}`
  orbitDbAddr: string
}

interface Janitored {
  id?: number
  moderationServiceAddress: number
  moderationServiceChainId: number
  threadId: string
  postId: string
  reason: number
  signature: string
  janny: `0x${string}`
}

interface BoardsSync {
  chainId: number
  boardIterator: number
  lastSynced: number
}

type HashchanDB = Dexie & {
  boardsSync: EntityTable<BoardsSync, 'chainId'>
  boards: EntityTable<Board, 'boardId'>
  threads: EntityTable<Thread, 'threadId'>
  posts: EntityTable<Post, 'postId'>
  settings: EntityTable<Settings, 'id'>
  hookSettings: EntityTable<HookSettings, 'id'>
  moderationServices: EntityTable<ModerationService, 'id'>
  janitored: EntityTable<Janitored, 'id'>
}

const identity = (s: string) => s

export const IDBContext = createContext<{
  db: HashchanDB | null
  sanitize: (raw: string) => string
}>({ db: null, sanitize: identity })

const DEFAULT_TIP_AMOUNT = '1618033988749895'

export const IDBProvider = ({
  children,
  sanitize = identity,
}: {
  children: React.ReactNode
  sanitize?: (raw: string) => string
}) => {
  const [db, setDb] = useState<HashchanDB | null>(null)

  useEffect(() => {
    const db = new Dexie('hashchan') as HashchanDB
    const STORES = {
      boardsSync: 'chainId',
      boards: '++id, boardId, &[boardId+chainId], chainId, [chainId+favourite]',
      threads: '++id, &threadId, bookmarked, [boardId+chainId], timestamp',
      posts: '++id, &postId, threadId, bookmarked, timestamp',
      settings: '++id',
      moderationServices: '++id, &[address+chainId], subscribed, address',
      janitored: '++id, moderationServiceAddress, postId, threadId',
    }

    db.version(6).stores(STORES)
    db.version(7).stores(STORES).upgrade((tx) =>
      tx.table('settings').toCollection().modify((s) => {
        if (s.blockRangeLimit === undefined) s.blockRangeLimit = 10000
      })
    )
    // v8: split indexer-specific fields out of `settings` into their own
    // `hookSettings` table, carrying forward any existing values.
    db.version(8).stores({ ...STORES, hookSettings: '++id' }).upgrade(async (tx) => {
      const existing = await tx.table('settings').toCollection().first()
      await tx.table('hookSettings').add({
        indexingStrategy: existing?.indexingStrategy ?? 'fullNode',
        blockRangeLimit: existing?.blockRangeLimit ?? 10000,
        maxBlockRangeDetected: null,
        lastDoctorRunAt: null,
      })
      await tx.table('settings').toCollection().modify((s) => {
        delete s.indexingStrategy
        delete s.blockRangeLimit
      })
    })
    // v9: replace the scanBoundary scalar with scannedSpans (see
    // utils/spans.ts) on both boards and threads, without resetting anyone's
    // existing scan progress — a row that had already synced up to
    // lastSynced keeps that as one span, floored at whatever scanBoundary
    // (or failing that blockCreatedAt) it had reached backward.
    db.version(9).stores(STORES).upgrade((tx) => Promise.all([
      tx.table('boards').toCollection().modify((b) => {
        b.scannedSpans = b.lastSynced
          ? [{ fromBlock: b.scanBoundary ?? b.blockCreatedAt ?? b.lastSynced, toBlock: b.lastSynced }]
          : []
        delete b.scanBoundary
      }),
      tx.table('threads').toCollection().modify((t) => {
        t.scannedSpans = t.lastSynced
          ? [{ fromBlock: t.scanBoundary ?? t.blockCreatedAt ?? t.lastSynced, toBlock: t.lastSynced }]
          : []
        delete t.scanBoundary
      }),
    ]))

    ;(async () => {
      const settings = await db.settings.toArray()
      if (settings.length === 0) {
        await db.settings.add({
          tosAccepted: false,
          tosTimestamp: 0,
          defaultTipAmount: DEFAULT_TIP_AMOUNT,
        })
      }

      const hookSettings = await db.hookSettings.toArray()
      if (hookSettings.length === 0) {
        await db.hookSettings.add({
          // reverseChunked is the sensible default now that the span model,
          // atBlock/toBlock sharing, and RPC Doctor step-down make it robust
          // for a fresh install with no idea what its RPC can handle.
          indexingStrategy: 'reverseChunked',
          blockRangeLimit: 10000,
          maxBlockRangeDetected: null,
          lastDoctorRunAt: null,
        })
      }

      setDb(db)
    })()

    return () => db.close()
  }, [])

  return <IDBContext.Provider value={{ db, sanitize }}>{children}</IDBContext.Provider>
}
