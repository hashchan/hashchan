import {
  useContext,
  useState,
  useCallback
} from 'react'

import { useAccount } from 'wagmi'

import { IDBContext } from '@/provider/IDBProvider'
import { useContracts } from '@/hooks/useContracts'

import { useBoard } from '@/hooks/HashChan/useBoard'
import { computeImageCID } from '@/utils/cids'


export const useCreateThread = () => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard()
  const { hashchan } = useContracts()
  const { address } =  useAccount()

  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [threadId, setThreadId] = useState(null)

  const [logErrors, setLogErrors] = useState([])


  const createThread = useCallback(async (
    title: string,
    imageUrl: string,
    content: string
  )  => {
    if (db && board && hashchan && address) {

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        setLogErrors(old => [...old, error])
      }
      try {
        const unwatch = hashchan.watchEvent.NewThread(
          {
            boardId: board.boardId,
            creator: address
          },
          {
            onError: (error) => {
              console.log('error', error)
              setLogErrors(old => [...old, error.message])
            },
            onLogs: async (logs) => {
              console.log('onLogs', logs)
              setLogs(logs)
              setThreadId(logs[0].args.threadId)
              // maybe lastsynced here
              await db.threads.add(logs[0].args)
              unwatch()
            }
          }
        )
        const hash = await hashchan.write.createThread([
          board.boardId,
          title,
          imageUrl,
          cid,
          content
        ])
        setHash(hash)
      } catch (e) {
        console.error(e)
        setLogErrors(old => [...old, e])
      }
    }
  }, [
    hashchan,
    db,
    board,
    address,
  ])

  return {
    hash,
    logs,
    logErrors,
    threadId,
    createThread
  }
}
