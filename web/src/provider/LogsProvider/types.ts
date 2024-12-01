import {type Dexie, type EntityTable } from 'dexie';

export type RPCType = 'public' | 'dedicated' | 'archive';



export interface ChainSync {
  chainId: number;
  rpcType: RPCType;
  ranges: BlockRange[];
  oldestAccessibleBlock: number;
  maxBlockRange: number;
  lastSyncedBlock: number;

}


export interface BlockRange {
  fromBlock: number;
  toBlock: number;
  synced: boolean;
  lastAttempt: number;
}



export interface Post {
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

export interface Thread {
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

export interface Board {
  id: number;
  lastSynced: number;
  chainId: number;
  boardId: number;
  name: string;
  symbol: string;
  favourite: number;
}

export interface BoardsSync {
  chainId: number;
  lastSynced: number;
}

export type HashchanDB = Dexie & {
  chainSync: EntityTable<ChainSync,'chainId'>,
  boardsSync: EntityTable<BoardsSync,'chainId'>,
  boards: EntityTable<Board,'boardId'>,
  threads: EntityTable<Thread,'threadId'>,
  posts: EntityTable<Post,'postId'>
}
