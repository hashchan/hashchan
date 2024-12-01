import { createContext, useEffect, useState } from 'react';
import { HashchanDB } from './types';
import { CHAIN_CONFIGS } from './utils';
import { Dexie } from 'dexie';
import { useLogFetching } from './useLogFetching';
export const LogsContext = createContext({
	db:null,
	fetchLogs: async () => []
})

export const LogsProvider = ({ children }) => {
	const [db, setDb] = useState<HashchanDB>(null)
	const { fetchLogs } = useLogFetching(null, db);
	useEffect(() => {
		const db = new Dexie('hashchandb') as HashchanDB
		db.version(2).stores({
			chainSync: 'chainId',
			boardsSync: 'chainId',
			boards: '++id, boardId, &[boardId+chainId], chainId, [chainId+favourite]',
			threads: '++id, &threadId, [boardId+chainId], timestamp',
			posts: '++id, &postId, threadId, timestamp'
		})

		const initializeChainConfigs = async () => {
			// Pre-fill chainSync table with known configurations
			await Promise.all(
				Object.entries(CHAIN_CONFIGS).map(async ([chainId, config]) => {
					const existingSync = await db.chainSync.get(Number(chainId));
					if (!existingSync) {
						await db.chainSync.add({
							chainId: Number(chainId),
							rpcType: config.rpcType,
              ranges: [],
							oldestAccessibleBlock: config.oldestKnownBlock,
							maxBlockRange: config.maxBlockRange,
							lastSyncedBlock: 0
						});
					}
				})
			);
		};

		initializeChainConfigs();
		setDb(db)
		return () => db.close()
	}, [])

	return (
		<LogsContext.Provider value={{
			db: db,
			fetchLogs: fetchLogs
			}}
		>
			{children}
		</LogsContext.Provider>
	)
}
