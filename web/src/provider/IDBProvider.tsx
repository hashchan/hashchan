import { createContext, useEffect, useState } from 'react';
import Dexie, { type EntityTable } from 'dexie';


interface Post {
  id: number;
  boardId: number;
  threadId: string;
  postId: string;
  creator: `0x${string}`;
  imgUrl: string;
  replyIds: string[];
  content: string;
  timestamp: number

}

interface Thread {
  id: number;
  lastSynced: number;
  boardId: number;
  threadId: string;
  creator: `0x${string}`;
  imgUrl: string;
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
  favourite: number;
}

interface BoardsSync {
  chainId: number;
  lastSynced: number;
}


type HashchanDB = Dexie & {
  boardsSync: EntityTable<BoardsSync,'chainId'>,
  boards: EntityTable<Board,'boardId'>,
  threads: EntityTable<Thread,'threadId'>,
  posts: EntityTable<Post,'postId'>
}

export const IDBContext = createContext({
  db:null
})

export const IDBProvider = ({ children }) => {
  const [db, setDb] = useState<HashchanDB>(null)

  useEffect(() => {
    const db = new Dexie('hashchandb') as HashchanDB
    db.version(1).stores({
      boardsSync: 'chainId',
      boards: '++id, boardId, &[boardId+chainId], chainId, [chainId+favourite]',
      threads: '++id, &threadId, [boardId+chainId], timestamp',
      posts: '++id, &postId, threadId, timestamp'
    })
    setDb(db)
    return () => db.close()
  }, [])

  return (
    <IDBContext.Provider value={{
      db: db
      }}
    >
      {children}
    </IDBContext.Provider>
  )
}
