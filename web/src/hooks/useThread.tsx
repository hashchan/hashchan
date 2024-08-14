import {useState, useEffect, useCallback, createRef} from 'react'
import {
  useAccount,
  usePublicClient,
  useWatchContractEvent,
  useWalletClient
} from 'wagmi'
import { writeContract,waitForTransactionReceipt  } from '@wagmi/core'
import { address as hashChanAddress, abi } from '@/assets/HashChan.json'


import { config } from '@/config'
import reactStringReplace from 'react-string-replace';
import { ReplyLink } from '@/components/ReplyLink'

const parseContent = (content: string, refsObj:any) => {
  const replyIds: string[] = []
  const parsed = reactStringReplace(
    content,
    /@(0x.{64})/gm,
    (match, i) => {
      replyIds.push(match)
      if (refsObj) {
        const ref = refsObj[match]
        match = match.replace(/@+/g,'')
        return <ReplyLink key={i} replyId={match} ref={ref} />
      } else {
        match = match.replace(/@+/g,'')
        return <ReplyLink key={i} replyId={match} ref={createRef()} />

      }
    }
  )

  return {
    replyIds,
     parsed
  }
    
}

export const useThread = (threadId: string) => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const watchThread = useCallback(async () => {
    if (publicClient && address && threadId) {
      try {
        const unwatch = publicClient.watchContractEvent({
          address: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Comment',
          args: {
            threadId
          },
          onLogs(logs) {
            const localRefsObj = refsObj
            const localLogsObj = logsObj
            const { replyIds, parsed } = parseContent(logs[0].args.content, localRefsObj)
            localRefsObj[logs[0].args.id] = createRef()

            replyIds.forEach((replyId, i) => {
              localLogsObj[replyId].replies.push({ref: localRefsObj[log.args.id], id: log.args.id})
            })
            const post = {
              creator: logs[0].args.creator,
              id: logs[0].args.id,
              imgUrl: logs[0].args.imgUrl,
              content: parsed,
              timestamp: Number(logs[0].args.timestamp),
              replies: [],
              ref: localRefsObj[logs[0].args.id]
            }
            setPosts(old => [...old, post])
            setRefsObj(refsObj)
            setLogsObj(logsObj)
          }
        })

      } catch (e) {
        console.log('logErrors', e)
        setLogErrors(old => [...old, e.toString()])
      }
    }  
  }, [publicClient, address, threadId, refsObj, logsObj])


  const fetchPosts = useCallback(async () => {
    if (publicClient && address && threadId) {

        const threadFilter = await publicClient.createContractEventFilter({
          address: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Thread',
          args: {
            id: threadId
          },
          fromBlock: 0n,
          toBlock: 'latest'
        })

        const threadLogs = await publicClient.getFilterLogs({
          filter: threadFilter,
        })

          const localRefsObj = {
            [threadLogs[0].args.id] : createRef(),
          }
          const localLogsObj = {
            [threadLogs[0].args.id]: {
              creator: threadLogs[0].args.creator,
              id: threadLogs[0].args.id,
              imgUrl: threadLogs[0].args.imgUrl,
              content: threadLogs[0].args.content,
              timestamp: Number(threadLogs[0].args.timestamp),
              replies: [],
              ref: localRefsObj[threadLogs[0].args.id]
            }
          }

     try {
        const filter = await publicClient.createContractEventFilter({
          address: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Comment',
          fromBlock: 0n,
          toBlock: 'latest',
          args: {
            threadId: threadId
          }
        })

        const logs = await publicClient.getFilterLogs({
          filter
        })
        
        logs.forEach((log) => {
          const { replyIds, parsed } = parseContent(log.args.content, localRefsObj)
          localRefsObj[log.args.id] = createRef()

          localLogsObj[log.args.id] = {
            creator: log.args.creator,
            id: log.args.id,
            imgUrl: log.args.imgUrl,
            timestamp: Number(log.args.timestamp),
            replies: [],
            ref: localRefsObj[log.args.id]
          }
          replyIds.forEach((replyId, i) => {
            localLogsObj[replyId].replies.push({ref: localRefsObj[log.args.id], id: log.args.id})
          })
          localLogsObj[log.args.id].content = parsed
        })

        setPosts(Object.values(localLogsObj))
        setLogsObj(localLogsObj)
        setRefsObj(localRefsObj)
      } catch (e) {
        console.log('logErrors', e.text)
        setLogErrors(old => [...old, e.toString()])
      }

    }
  }, [publicClient, address, threadId ])


  const createPost = useCallback(async (
    imgUrl: string,
    content: string
  ) => {
    if (walletClient && address) {
      try {
        const result = await writeContract(config, {
          address: hashChanAddress as `0x${string}`,
          abi,
          functionName: 'createComment',
          args: [
            threadId,
            imgUrl,
            content 
          ]
        })
        if (!isWatchingEnabled) {
          fetchPosts()
        }
        return {
          hash: result,
          error: null
        }
      } catch (e) {
        return {
          hash: null,
          error: e
        }
      }

    } 
  }, [walletClient, address, threadId, fetchPosts])


  useEffect(() => {
    if (threadId) {
      //fetchThread()
      fetchPosts()
      watchThread()
    }
  }, [threadId, /*fetchThread,*/ fetchPosts, watchThread])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

