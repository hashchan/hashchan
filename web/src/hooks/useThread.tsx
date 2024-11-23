import {
  useContext,
  useState,
  useEffect,
  useCallback,
  createRef
} from 'react'
import { IDBContext } from '@/provider/IDBProvider'
import { parseEventLogs } from 'viem'
import {
  useAccount,
  usePublicClient,
  useWatchContractEvent,
  useWalletClient,
  useBlockNumber
} from 'wagmi'
import { config } from '@/config'
import { writeContract,waitForTransactionReceipt  } from '@wagmi/core'
import { useContract } from '@/hooks/useContract'

import  sanitizeMarkdown  from 'sanitize-markdown'
import { parseContent } from '@/utils'
import reactStringReplace from 'react-string-replace';

/*
const parseContentTwo = (content: string, refsObj:any) => {
  const replyIds: string[] = []
  let parsed = reactStringReplace(
    content,
    /[#@](0x.{64})/gm,
    (match, i) => {
      replyIds.push(match)
      if (refsObj) {
        const ref = refsObj[match]
        match = match.replace(/[#@]+/g,'')
        return `[${match}](${window.location.href}#${match})`
      } else {
        match = match.replace(/[@#]+/g,'')
        return `[${match}](${window.location.href}#${match})`
      }
    }
  )
  return {
    replyIds
  }
}
 */

export const useThread = (threadId: string, boardId: string) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { db } = useContext(IDBContext)
  const { address, chain } = useAccount()
  const blockNumber = useBlockNumber();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { contractAddress, abi } = useContract()


  const fetchPosts = useCallback(async () => {
    if (publicClient && address && threadId && chain && db && boardId) {
      const cachedThread = await db.threads.where('threadId').equals(threadId).first()
      let thread;
      if (cachedThread) {
        console.log('cached thread', cachedThread)
        thread = {
          lastSynced: cachedThread.lastSynced,
          creator: cachedThread.creator,
          threadId: cachedThread.threadId,
          imgUrl: cachedThread.imgUrl,
          content: sanitizeMarkdown(cachedThread.content, { allowedTags: ['p', 'div', 'img'] }),
          replies: [],
          timestamp: Number(cachedThread.timestamp)
        }
      } else {
        //fetching thread from event logs
        const threadFilter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewThread',
          args: {
            id: threadId
          },
          fromBlock: 0n, // maybe blockheigt of deployment is better
          toBlock: blockNumber.data
        })

        const threadLogs = await publicClient.getFilterLogs({
          filter: threadFilter,
        })


        const { creator, content, id:threadId, imgUrl, replyIds, timestamp } = threadLogs[0].args

        thread = {
          lastSynced: 0,
          creator,
          threadId,
          imgUrl,
          replyIds,
          replies: [],
          content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
          timestamp: Number(timestamp)
        }

      }


      const localRefsObj = {
        [thread.threadId] : createRef(),
      }
      const localLogsObj = {
        [thread.threadId]: {
          creator: thread.creator,
          threadId: thread.threadId,
          imgUrl: thread.imgUrl,
          content: thread.content,
          timestamp: thread.timestamp,
          replies: [],
          replyIds: thread.replyIds,
          ref: localRefsObj[thread.id]
        }
      }

      try {
        const cachedPosts = await db.posts.where('threadId').equals(threadId).sortBy('timestamp')

        if (cachedPosts.length > 0) {
          cachedPosts.forEach((post) => {
            post.replies = []
            localRefsObj[post.postId] = createRef()
            localLogsObj[post.postId] = {
              ...post,
              ref: localRefsObj[post.postId]
            }
            /*
            post.replyIds.forEach((ri) => {
              localLogsObj[ri].replies.push({ref: localRefsObj[post.postId], id: post.postId})
            })
             */
          })
        }
        console.log('last synced', thread.lastSynced)
        console.log('to block', blockNumber.data)
        const filter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewPost',
          fromBlock: BigInt(thread.lastSynced ? thread.lastSynced : 0),
          toBlock: blockNumber.data,
          args: {
            threadId: threadId
          }
        })
        const logs = await publicClient.getFilterLogs({
          filter
        })

        logs.forEach(async (log) => {
          const { creator, id:postId, imgUrl, content, replyIds, timestamp } = log.args
          //const { replyIds } = parseContentTwo(content, localRefsObj)
          //const { replyIds, parsed } = parseContentTwo(content, localRefsObj)
          localRefsObj[postId] = createRef()

          localLogsObj[postId] = {
            creator,
            postId,
            imgUrl,
            timestamp: Number(timestamp),
            replies: [],
            content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
            ref: localRefsObj[postId]
          }
          replyIds.forEach((replyId, i) => {
            localLogsObj[replyId].replies.push({ref: localRefsObj[postId], id:postId})
          })
          //localLogsObj[log.args.id].content = parsed
          //localLogsObj[id].content = sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] })
          //
          const isCached = await db.posts.where('postId').equals(postId).first()
          if (!isCached) {
            await db.posts.add({
              boardId: boardId,
              threadId: threadId,
              postId: postId,
              creator: creator,
              imgUrl: imgUrl,
              replyIds: replyIds,
              content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
              timestamp: Number(timestamp)
            })
          }

        })
        setPosts(Object.values(localLogsObj))
        setLogsObj(localLogsObj)
        setRefsObj(localRefsObj)
        console.log('trying to update last synced')
        const update = await db.threads.where('threadId').equals(threadId).modify({
          lastSynced: Number(blockNumber.data)
        })
        console.log('update', update)
      } catch (e) {
        console.error(e)
        console.log('logErrors', e.text)
        setLogErrors(old => [...old, e.toString()])
      }

    }
  }, [
    publicClient,
    address,
    threadId,
    chain,
    contractAddress,
    abi,
    blockNumber.data,
    db,
    boardId
  ])


  const createPost = useCallback(async (
    board: string,
    imgUrl: string,
    content: string,
    replyIds: string[]
  ) => {
    if (publicClient && walletClient && address && chain) {
      try {

        const hash = await writeContract(config, {
          address: contractAddress,
          abi,
          functionName: 'createPost',
          args: [
            Number(board),
            threadId,
            replyIds,
            imgUrl,
            content 
          ]
        })

        const receipt = await waitForTransactionReceipt(config, {hash})

        const logs = parseEventLogs({
          abi,
          logs: receipt.logs
        })
        /*
           const id = await db.threads.add({
id: logs[0].args.id,
creator: logs[0].args.creator,
imgUrl: logs[0].args.imgUrl,
content: logs[0].args.content,
timestamp: logs[0].args.timestamp
})
         */

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
  }, [
    publicClient,
    walletClient,
    address,
    threadId,
    chain,
    contractAddress,
    abi
  ])


  useEffect(() => {
    let unwatch;
    if (
      isInitialized ||
      !address ||
      !chain ||
      !db ||
      !publicClient ||
      !contractAddress ||
      !abi ||
      !blockNumber.data ||
      !boardId
    ) return


    const init = async () => {
      await fetchPosts()
      console.log('setting up watch')
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi,
        eventName: 'NewPost',
        fromBlock: blockNumber.data,
        args: {
          threadId
        },
        async onLogs(logs) {
          console.log('logs', logs)
          const { creator, content, id:postId, imgUrl, timestamp } = logs[0].args
          setRefsObj((oldRefs) => {
            const replyIds  = parseContent(content)
            oldRefs[postId] = createRef()

            setLogsObj((oldLogs) => {
              replyIds.forEach((replyId) => {
                oldLogs[replyId].replies.push({ref: oldRefs[postId], id:postId})
              })
              return oldLogs
            })

            const post = {
              creator,
              postId,
              imgUrl,
              content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
              timestamp: Number(timestamp),
              replies: [],
              ref: oldRefs[postId]
            }
            setPosts(old => [...old, post])

            return oldRefs
          })
        }
      })
      setIsInitialized(true)
    }
    init()
    return () => {
      if (unwatch) unwatch()
    }

  },[
    fetchPosts,
    isInitialized,
    publicClient,
    address,
    threadId,
    chain,
    contractAddress,
    abi,
    blockNumber.data,
    db,
    boardId
  ])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

