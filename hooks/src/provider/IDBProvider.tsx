import { createContext, useEffect, useState } from 'react'
import Dexie, { type EntityTable } from 'dexie'

export type IndexingStrategy = 'fullNode' | 'reverseChunked' | 'bulkScrape'

export interface Settings {
  id?: number
  tosAccepted: boolean
  tosTimestamp: number
  defaultTipAmount: string
  indexingStrategy: IndexingStrategy
  // user-adjustable: lower when the RPC starts rejecting large ranges in reverseChunked mode
  blockRangeLimit: number
}

export interface Board {
  id?: number
  lastSynced: number
  scanBoundary?: number
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
  lastSynced: number
  scanBoundary?: number
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

    ;(async () => {
      const settings = await db.settings.toArray()
      if (settings.length === 0) {
        await db.settings.add({
          tosAccepted: false,
          tosTimestamp: 0,
          defaultTipAmount: DEFAULT_TIP_AMOUNT,
          indexingStrategy: 'fullNode',
          blockRangeLimit: 10000,
        })
      }
      setDb(db)
    })()

    return () => db.close()
  }, [])

  return <IDBContext.Provider value={{ db, sanitize }}>{children}</IDBContext.Provider>
}
