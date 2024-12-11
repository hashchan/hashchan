import {
  useContext,
  useState,
  useCallback
} from 'react'
import { useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'

import { IDBContext } from '@/provider/IDBProvider'
import { useContracts } from '@/hooks/useContracts'

import { useBoard } from '@/hooks/HashChan/useBoard'
import { computeImageCID } from '@/utils/cids'


export const useCreatePost = () => {
  const { db } = useContext(IDBContext)
  const { board } = useBoard()
  const { hashchan } = useContracts()
  const { address } =  useAccount()
  const { threadId } = useParams()

  const [hash, setHash] = useState(null)
  const [logs, setLogs] = useState([])
  const [logErrors, setLogErrors] = useState([])


  const createPost = useCallback(async (
    imageUrl: string,
    content: string,
    replyIds: string[]
  )  => {
    if (db && board && hashchan && address && threadId) {

      const { cid, error } = await computeImageCID(imageUrl)
      if (error) {
        setLogErrors(old => [...old, error])
      }
      try {
        const unwatch = hashchan.watchEvent.NewPost(
          {
            threadId: threadId,
            creator: address
          },
          {
            onError: (error) => {
              console.log('error', error)
              setLogErrors(old => [...old, error.message])
            },
            onLogs: async (logs) => {
              console.log('onLogs', logs)
              setLogs(old => [...old, ...logs])
              //(logs[0].args.threadId)
              // maybe lastsynced here
              //await db.threads.add(logs[0].args)
              unwatch()
            }
          }
        )
        console.log( board.boardId, threadId, replyIds, imageUrl, cid, content)
        const hash = await hashchan.write.createPost([
          board.boardId,
          threadId,
          replyIds,
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
    threadId
  ])

  return {
    hash,
    logs,
    logErrors,
    threadId,
    createPost
  }
}
