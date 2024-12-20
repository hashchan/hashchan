import {
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { useContracts } from '@/hooks/useContracts'
import { useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { IDBContext } from '@/provider/IDBProvider'
import { parseEventLogs } from 'viem'
import { computeImageCID } from '@/utils/cids'

export const useCreateBoard = () => {
  const { db } = useContext(IDBContext)
  const { address, chain } =  useAccount()
  const { hashchan } = useContracts()

  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])

  const createBoard = useCallback(async (
    name: string,
    symbol: string,
    description: string,
    bannerUrl: string,
    rules: string[]
  ) => {
    if (!db || !hashchan || !chain?.id) {
      setLogErrors(old => [...old, 'Initialization Error'])
      return
    }

    const { cid, error } = await computeImageCID(bannerUrl)
    if (error) {
      setLogErrors(old => [...old, error])
      return
    }

    try {

      const unwatch = hashchan.watchEvent.NewBoard(
        {},
        {
          onError: (error) => {
            console.log('error', error)
            setLogErrors(old => [...old, error.message])
          },
          onLogs: async (logs) => {
            console.log('onLogs', logs)
            logs.forEach(async (log) => {
              if (log.args.name == name) {
                const {
                  boardId,
                  name,
                  symbol,
                  bannerUrl,
                  bannerCID,
                  description,
                  rules,
                  timestamp
                } = log.args
                setLogs(old => [...old, ...logs])
                await db.boards.add({
                  lastSynced: 0,
                  chainId: Number(chain.id),
                  boardId: Number(boardId),
                  name,
                  symbol,
                  bannerUrl,
                  bannerCID,
                  description,
                  rules,
                  favourite: 0
                })
                unwatch()
              }
            })


          }
        }
      )

      const hash = await hashchan.write.createBoard([
        name,
        symbol,
        description,
        bannerUrl,
        cid,
        rules
      ])
      setHash(hash)
    } catch (e) {
      console.error(e)
      setLogErrors(old => [...old, e.message])
    }
  }, [
    address,
    chain?.id,
    hashchan,
    db
  ])


  return {
    createBoard,
    hash,
    logs,
    logErrors
  }
}



