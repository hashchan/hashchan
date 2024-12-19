import { createContext, useEffect, useState } from 'react';
import Dexie, { type EntityTable } from 'dexie';


interface ModerationService {
  id?: number;
  subscribed: number; // 0 = false, 1 = true
  uri: string;
  port: number;
  name: string;
  address: `0x${string}`;
  chainId: number;
  owner: `0x${string}`;
  orbitDbAddr: string;
}

interface Settings {
  id?: number;
  tosAccepted: boolean;
  tosTimestamp: number;
}

interface Post {
  id: number;
  boardId: number;
  threadId: string;
  postId: string;
  creator: `0x${string}`;
  imgUrl: string;
  imgCID: string;
  replyIds: string[];
  content: string;
  timestamp: number;
}

interface Janitored {
  id: number;
  moderationServiceAddress: number;
  moderationServiceChainId: number;
  threadId: string;
  postId: string;
  reason: number;
  signature: string;
  janny: `0x${string}`;
}

interface Thread {
  id: number;
  lastSynced: number;
  boardId: number;
  threadId: string;
  creator: `0x${string}`;
  imgUrl: string;
  imgCID: string;
  title: string;
  content: string;
  timestamp: number;
  chainId: number;
}

interface Board {
  id: number;
  lastSynced: number;
  chainId: number;
  boardId: number;
  name: string;
  symbol: string;
  description: string;
  bannerUrl: string;
  bannerCID: string;
  rules: string[];
  favourite: number; // 0 = false, 1 = true
}

interface BoardsSync {
  chainId: number;
  boardIterator: number;
  lastSynced: number;
}

type HashchanDB = Dexie & {
  boardsSync: EntityTable<BoardsSync,'chainId'>,
  boards: EntityTable<Board,'boardId'>,
  threads: EntityTable<Thread,'threadId'>,
  posts: EntityTable<Post,'postId'>,
  settings: EntityTable<Settings,'id'>
  moderationServices: EntityTable<ModerationService,'id'>
  janitored: EntityTable<Janitored,'id'>
}

export const IDBContext = createContext({
  db: null as HashchanDB | null
})

export const IDBProvider = ({ children }) => {
  const [db, setDb] = useState<HashchanDB | null>(null)

  useEffect(() => {
    const db = new Dexie('hashchan') as HashchanDB;
    db.version(3).stores({
      boardsSync: 'chainId',
      boards: '++id, boardId, &[boardId+chainId], chainId, [chainId+favourite]',
      threads: '++id, &threadId, [boardId+chainId], timestamp',
      posts: '++id, &postId, threadId, timestamp',
      settings: '++id',
      moderationServices: '++id, &[address+chainId], subscribed, address',
      janitored: '++id, moderationServiceAddress, postId, threadId'
    });

    (async () => {
      // Initialize settings if they don't exist
      const settings = await db.settings.toArray();
      if (settings.length === 0) {
        await db.settings.add({
          tosAccepted: false,
          tosTimestamp: 0,
        });
      }
      setDb(db);
    })();
    return () => db.close()
  }, [])

  return (
    <IDBContext.Provider value={{db}}>
      {children}
    </IDBContext.Provider>
  )
}
