import { useContext, useState, useCallback } from 'react'
import { useConnection } from 'wagmi'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { computeImageCID } from '../utils/cids'
import { type NewBoardArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreateBoard = () => {
  const { db } = useContext(IDBContext)
  const { address, chain } = useConnection()
  const { hashchan } = useContracts()

  const [status, setStatus] = useState<TxStatus>('idle')
  const [hash, setHash] = useState<`0x${string}` | null>(null)
  const [logs, setLogs] = useState<FilterLog<NewBoardArgs>[]>([])
  const [logErrors, setLogErrors] = useState<string[]>([])

  const reset = useCallback(() => {
    setStatus('idle')
    setHash(null)
    setLogs([])
    setLogErrors([])
  }, [])

  const createBoard = useCallback(
    async (
      name: string,
      symbol: string,
      description: string,
      bannerUrl: string,
      rules: string[]
    ) => {
      const missing = checkDeps({ db, hashchan, chainId: chain?.id })
      if (missing.length > 0) {
        console.debug('[hashchan] createBoard not ready:', missing.join(', '))
        return
      }

      const { cid, error } = await computeImageCID(bannerUrl)
      if (error) {
        setLogErrors((old) => [...old, error])
        setStatus('error')
        return
      }

      setStatus('submitting')

      try {
        const unwatch = hashchan.watchEvent.NewBoard(
          {},
          {
            onError: (error: Error) => {
              setLogErrors((old) => [...old, error.message])
              setStatus('error')
            },
            onLogs: async (newLogs: FilterLog<NewBoardArgs>[]) => {
              for (const log of newLogs) {
                if (log.args.name !== name) continue
                const { boardId, name: n, symbol: s, bannerUrl: bu, bannerCID, description: d, rules: r } = log.args
                setLogs((old) => [...old, log])
                await db!.boards.add({
                  lastSynced: 0,
                  chainId: Number(chain!.id),
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
                setStatus('confirmed')
                unwatch()
              }
            },
          }
        )

        const txHash = await hashchan.write.createBoard([name, symbol, description, bannerUrl, cid, rules])
        setHash(txHash)
        setStatus('pending')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [address, chain?.id, hashchan, db]
  )

  return { status, hash, logs, logErrors, reset, createBoard }
}
