import { useContext, useState, useCallback } from 'react'
import { useConnection, usePublicClient } from 'wagmi'
import { parseEventLogs } from 'viem'

import { IDBContext } from '../provider/IDBProvider'
import { useContracts } from './useContracts'
import { computeImageCID } from '../utils/cids'
import { type NewBoardArgs, type FilterLog, type TxStatus } from '../types/events'
import { checkDeps } from '../utils/enabled'

export const useCreateBoard = () => {
  const { db } = useContext(IDBContext)
  const { address, chain } = useConnection()
  const { hashchan } = useContracts()
  const publicClient = usePublicClient()

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
      const missing = checkDeps({ db, hashchan, chainId: chain?.id, publicClient })
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
        const txHash = await hashchan.write.createBoard([name, symbol, description, bannerUrl, cid, rules])
        setHash(txHash)
        setStatus('pending')

        // Decode straight from this transaction's own receipt instead of a
        // watchEvent race matched only by name, which could also match
        // another board created with the same name around the same time.
        const receipt = await publicClient!.waitForTransactionReceipt({ hash: txHash })
        const [newBoardLog] = parseEventLogs({
          abi: hashchan.abi,
          eventName: 'NewBoard',
          logs: receipt.logs,
        }) as unknown as FilterLog<NewBoardArgs>[]

        if (!newBoardLog) {
          setLogErrors((old) => [...old, 'NewBoard event not found in transaction receipt'])
          setStatus('error')
          return
        }

        const { boardId, name: n, symbol: s, bannerUrl: bu, bannerCID, description: d, rules: r } = newBoardLog.args
        await db!.boards.add({
          lastSynced: 0,
          blockCreatedAt: Number(newBoardLog.blockNumber),
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
        setLogs((old) => [...old, newBoardLog])
        setStatus('confirmed')
      } catch (e: any) {
        setLogErrors((old) => [...old, e.message])
        setStatus('error')
      }
    },
    [address, chain?.id, hashchan, db, publicClient]
  )

  return { status, hash, logs, logErrors, reset, createBoard }
}
