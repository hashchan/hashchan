import { useContext, useState, useCallback } from 'react'
import { useAccount } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { computeImageCID } from '../utils/cids'

export const useCreateBoard = () => {
  const { db } = useContext(IDBContext)
  const { address, chain } = useAccount()
  const { hashchan } = useContracts()

  const [hash, setHash] = useState<string | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logErrors, setLogErrors] = useState<any[]>([])

  const createBoard = useCallback(
    async (
      name: string,
      symbol: string,
      description: string,
      bannerUrl: string,
      rules: string[]
    ) => {
      if (!db || !hashchan || !chain?.id) {
        setLogErrors((old) => [...old, 'Initialization Error'])
        return
      }

      const { cid, error } = await computeImageCID(bannerUrl)
      if (error) {
        setLogErrors((old) => [...old, error])
        return
      }

      try {
        const unwatch = hashchan.watchEvent.NewBoard(
          {},
          {
            onError: (error: any) => {
              setLogErrors((old) => [...old, error.message])
            },
            onLogs: async (newLogs: any[]) => {
              for (const log of newLogs) {
                if (log.args.name !== name) continue
                const { boardId, name: n, symbol: s, bannerUrl: bu, bannerCID, description: d, rules: r } = log.args
                setLogs((old) => [...old, log])
                await db.boards.add({
                  lastSynced: 0,
                  chainId: Number(chain.id),
                  boardId: Number(boardId),
                  name: n,
                  symbol: s,
                  bannerUrl: bu,
                  bannerCID,
                  description: d,
                  rules: r,
                  favourite: 0,
                  metadata: { stats: { threadCount: 0, postCount: 0 } },
                })
                unwatch()
              }
            },
          }
        )

        const txHash = await hashchan.write.createBoard([name, symbol, description, bannerUrl, cid, rules])
        setHash(txHash)
      } catch (e: any) {
        console.error(e)
        setLogErrors((old) => [...old, e.message])
      }
    },
    [address, chain?.id, hashchan, db]
  )

  return { createBoard, hash, logs, logErrors }
}
