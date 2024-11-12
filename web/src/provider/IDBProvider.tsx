import { createContext, useEffect, useState } from 'react';
import Dexie, { type EntityTable } from 'dexie';
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi';
import { useContract } from '@/hooks/useContract2'

interface Post {
  boardId: number;
  threadId: string;
  id: string;
  creator: `0x${string}`;
  imgUrl: string;
  replyIds: string[];
  content: string;
  timestamp: number

}

interface Thread {
  lastSynced: number;
  boardId: number;
  id: string;
  creator: `0x${string}`;
  imgUrl: string;
  title: string;
  content: string;
  timestamp: number;
}

interface Board {
  lastSynced: number;
  id: number;
  name: string;
  symbol: string;
}


type HashchanDB = Dexie & {
  boards: EntityTable<
    Board,
    'id'
  >,
  threads: EntityTable<
    Thread,
    'id'
  >,
  posts: EntityTable<
    Post,
    'id'
  >
}

export const IDBContext = createContext({
  db:null
})


export const IDBProvider = ({ children }) => {

  const [db, setDb] = useState<HashchanDB>(null)

  useEffect(() => {
    const db = new Dexie('hashchandb') as HashchanDB
    db.version(1).stores({
      boards: 'id, name, symbol',
      threads: 'id, boardId, timestamp',
      posts: 'id, threadId, timestamp'
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
