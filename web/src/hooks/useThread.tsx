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
  let parsed = reactStringReplace(
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
  parsed = reactStringReplace(
    parsed,
    />(.*?)\\n/gm,
    (match, i) => {
      return <p key={i + 'm'} style={{color: '#DF3DF1'}}>{"> " + match}</p>
    } )

  return {
    replyIds,
     parsed
  }
    
}
const parseContentTwo = (content: string, refsObj:any) => {
  const replyIds: string[] = []
  let parsed = reactStringReplace(
    content,
    /@(0x.{64})/gm,
    (match, i) => {
      replyIds.push(match)
      if (refsObj) {
        const ref = refsObj[match]
        match = match.replace(/@+/g,'')
        return `[${match}](${window.location.href}#${match})`
      } else {
        match = match.replace(/@+/g,'')
        return `[${match}](${window.location.href}#${match})`

      }
    }
  )

  return {
    replyIds
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
            const { creator, content, id, imgUrl, timestamp } = logs[0].args
            const localRefsObj = refsObj
            const localLogsObj = logsObj
            //const { replyIds, parsed } = parseContent(logs[0].args.content, localRefsObj)
            const { replyIds } = parseContentTwo(content, localRefsObj)
            localRefsObj[id] = createRef()

            replyIds.forEach((replyId, i) => {
              localLogsObj[replyId].replies.push({ref: localRefsObj[id], id})
            })
            const post = {
              creator,
              id,
              imgUrl,
              content: content,
              //content: parsed,
              timestamp: Number(timestamp),
              replies: [],
              ref: localRefsObj[id]
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

        const { creator, id, imgUrl, content, timestamp } = threadLogs[0].args

          const localRefsObj = {
            [id] : createRef(),
          }
          const localLogsObj = {
            [id]: {
              creator,
              id,
              imgUrl,
              content,
              timestamp: Number(timestamp),
              replies: [],
              ref: localRefsObj[id]
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
          const { creator, id, imgUrl, content, timestamp } = log.args
          const { replyIds } = parseContentTwo(content, localRefsObj)
          //const { replyIds, parsed } = parseContentTwo(content, localRefsObj)
          localRefsObj[id] = createRef()

          localLogsObj[id] = {
            creator,
            id,
            imgUrl,
            timestamp: Number(timestamp),
            replies: [],
            ref: localRefsObj[id]
          }
          replyIds.forEach((replyId, i) => {
            localLogsObj[replyId].replies.push({ref: localRefsObj[id], id})
          })
          //localLogsObj[log.args.id].content = parsed
          localLogsObj[id].content = content
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
    if (publicClient && walletClient && address) {
      try {
        const hash = await writeContract(config, {
          address: hashChanAddress as `0x${string}`,
          abi,
          functionName: 'createComment',
          args: [
            threadId,
            imgUrl,
            content 
          ]
        })

        const receipt = await waitForTransactionReceipt(config, {hash})
 

        return {
          receipt: receipt,
          error: null
        }
      } catch (e) {
        console.log('e', e)
        return {
          receipt: null,
          error: e
        }
      }

    } 
  }, [publicClient, walletClient, address, threadId])


  useEffect(() => {
    if (threadId) {
      //fetchThread()
      fetchPosts()
      //watchThread()
    }
  }, [threadId, /*fetchThread,*/ fetchPosts, /*watchThread*/])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

