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
import { Thread } from '@/provider/IDBProvider'


export const useCreateThread = () => {
  const { db } = useContext(IDBContext)
  const { board, updateMetadata } = useBoard()
  const { hashchan } = useContracts()
  const { address, chainId } =  useAccount()

  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [threadId, setThreadId] = useState(null)

  const [logErrors, setLogErrors] = useState([])


  const createThread = useCallback(async (
    title: string,
    imageUrl: string,
    content: string
  )  => {
    if (db && board && hashchan && address && chainId) {

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
              /*
              const newThread:Thread = {
                id: logs[0].args.threadId,
                lastSynced: 0,
                boardId: Number(logs[0].args.boardId),
                threadId: logs[0].args.threadId,
                creator: logs[0].args.creator,
                imgUrl: logs[0].args.imgUrl,
                imgCID: logs[0].args.imgCID,
                title: logs[0].args.title,
                content: logs[0].args.content,
                timestamp: Number(logs[0].args.timestamp),
                chainId: Number(chainId)
              }
              await db.threads.add(newThread)

              // Update board's last synced timestamp
              await db.boards.update(board.boardId, { lastSynced: Date.now() })

              // Update board's thread count with the useBoard hook
              updateMetadata({ threadCount: 1})
              */

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
    chainId
  ])

  return {
    hash,
    logs,
    logErrors,
    threadId,
    createThread
  }
}
