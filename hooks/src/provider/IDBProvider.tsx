import { createContext, useEffect, useState } from 'react'
import Dexie, { type EntityTable } from 'dexie'

export interface Settings {
  id?: number
  tosAccepted: boolean
  tosTimestamp: number
  defaultTipAmount: string
  indexingStrategy: 'fullNode' | 'reverseChunked' | 'bulkScrape'
}

export interface Board {
  id?: number
  lastSynced: number
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

interface ModerationService {
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

export const IDBContext = createContext<{ db: HashchanDB | null }>({ db: null })

const DEFAULT_TIP_AMOUNT = '1618033988749895'

export const IDBProvider = ({ children }: { children: React.ReactNode }) => {
  const [db, setDb] = useState<HashchanDB | null>(null)

  useEffect(() => {
    const db = new Dexie('hashchan') as HashchanDB
    db.version(6).stores({
      boardsSync: 'chainId',
      boards: '++id, boardId, &[boardId+chainId], chainId, [chainId+favourite]',
      threads: '++id, &threadId, bookmarked, [boardId+chainId], timestamp',
      posts: '++id, &postId, threadId, bookmarked, timestamp',
      settings: '++id',
      moderationServices: '++id, &[address+chainId], subscribed, address',
      janitored: '++id, moderationServiceAddress, postId, threadId',
    })

    ;(async () => {
      const settings = await db.settings.toArray()
      if (settings.length === 0) {
        await db.settings.add({
          tosAccepted: false,
          tosTimestamp: 0,
          defaultTipAmount: DEFAULT_TIP_AMOUNT,
          indexingStrategy: 'fullNode',
        })
      }
      setDb(db)
    })()

    return () => db.close()
  }, [])

  return <IDBContext.Provider value={{ db }}>{children}</IDBContext.Provider>
}
