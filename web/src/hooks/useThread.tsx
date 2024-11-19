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

import reactStringReplace from 'react-string-replace';


const parseContentTwo = (content: string, refsObj:any) => {
  const replyIds: string[] = []
  console.log('content', content)
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

export const useThread = (threadId: string, boardId: string) => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { db } = useContext(IDBContext)
  const [lastBlock, setLastBlock] = useState(null)
  const { address, chain } = useAccount()
  const blockNumber = useBlockNumber();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { contractAddress, abi } = useContract()

  const watchThread = useCallback(async () => {
    let unwatch;
    if (publicClient && address && threadId && chain && db && blockNumber && abi && contractAddress && boardId) {
      try {
        unwatch = publicClient.watchContractEvent({
          address: contractAddress,
          abi,
          eventName: 'NewPost',
          fromBlock: blockNumber.data,
          args: {
            threadId
          },
          async onLogs(logs) {
            setLastBlock(await publicClient.getBlockNumber())
            console.log('onlog')
            const { creator, content, id, imgUrl, timestamp } = logs[0].args
            setRefsObj((oldRefs) => {
              const { replyIds } = parseContentTwo(content, oldRefs)
              oldRefs[id] = createRef()

              setLogsObj((oldLogs) => {
                replyIds.forEach((replyId) => {
                  oldLogs[replyId].replies.push({ref: oldRefs[id], id})
                })
                return oldLogs
              })

              const post = {
                creator,
                id,
                imgUrl,
                content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
                timestamp: Number(timestamp),
                replies: [],
                ref: oldRefs[id]
              }
              setPosts(old => [...old, post])

              return oldRefs
            })
          }
        })

      } catch (e) {
        console.log('logErrors', e)
        setLogErrors(old => [...old, e.toString()])
      }

      return () => {
        unwatch()
      }
    }  
  }, [publicClient, address, threadId, chain, contractAddress, abi, blockNumber, db, boardId ])


  const fetchPosts = useCallback(async () => {
    if (publicClient && address && threadId && chain && db && boardId) {
      console.log('trying to fetch posts')
      const cachedThread = await db.threads.get(threadId)
      console.log('cachedThread', cachedThread)
      const cachedPosts = await db.posts.where('threadId').equals(threadId).toArray()
      console.log('cachedPosts', cachedPosts)

      let thread;
      if (cachedThread) {
        thread = {
          lastSynced: cachedThread.lastSynced,
          creator: cachedThread.creator,
          id: cachedThread.id,
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

        console.log('threadLogs', threadLogs)

        const { creator, content, id, imgUrl, replyIds, timestamp } = threadLogs[0].args

        thread = {
          lastSynced: 0,
          creator,
          id,
          imgUrl,
          replyIds,
          replies: [],
          content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
          timestamp: Number(timestamp)
        }

      }


      const localRefsObj = {
        [thread.id] : createRef(),
      }
      const localLogsObj = {
        [thread.id]: {
          creator: thread.creator,
          id: thread.id,
          imgUrl: thread.imgUrl,
          content: thread.content,
          timestamp: thread.timestamp,
          replies: [],
          replyIds: thread.replyIds,
          ref: localRefsObj[thread.id]
        }
      }

      try {
        const cachedPosts = await db.posts.where('threadId').equals(threadId).toArray()

        if (cachedPosts.length > 0) {
          cachedPosts.forEach((post) => {
            post.replies = []
            localRefsObj[post.id] = createRef()
            localLogsObj[post.id] = {
              ...post,
              ref: localRefsObj[post.id]
            }
            post.replyIds.forEach((ri) => {
              console.log('ri', localLogsObj[ri])
              localLogsObj[ri].replies.push({ref: localRefsObj[post.id], id: post.id})
            })
          })
        }
        console.log('localLogsObj', localLogsObj)
        console.log('localRefsObj', localRefsObj)

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
        console.log('hitting api')
        const logs = await publicClient.getFilterLogs({
          filter
        })

        logs.forEach(async (log) => {
          console.log('log', log)
          const { creator, id, imgUrl, content, replyIds, timestamp } = log.args
          //const { replyIds } = parseContentTwo(content, localRefsObj)
          //const { replyIds, parsed } = parseContentTwo(content, localRefsObj)
          localRefsObj[id] = createRef()

          localLogsObj[id] = {
            creator,
            id,
            imgUrl,
            timestamp: Number(timestamp),
            replies: [],
            content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
            ref: localRefsObj[id]
          }
          console.log('replyids', replyIds)
          console.log('localRefsObj', localRefsObj)
          console.log('localLogsObj', localLogsObj)
          replyIds.forEach((replyId, i) => {
            console.log('replyId', replyId)
            localLogsObj[replyId].replies.push({ref: localRefsObj[id], id})
            console.log('localLogsObj', localLogsObj)
          })
          //localLogsObj[log.args.id].content = parsed
          //localLogsObj[id].content = sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] })
          //
          await db.posts.add({
            boardId: boardId,
            threadId: threadId,
            id: id,
            creator: creator,
            imgUrl: imgUrl,
            replyIds: replyIds,
            content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
            timestamp: Number(timestamp)

          })
          
        })
        setPosts(Object.values(localLogsObj))
        console.log('posts', Object.values(localLogsObj))
        setLogsObj(localLogsObj)
        setRefsObj(localRefsObj)
        await db.threads.update(threadId, {
          lastSynced: blockNumber.data
        })
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
        console.log('board', board)
        console.log('threadId', threadId)
        console.log('imgUrl', imgUrl)
        console.log('content', content)
        console.log('replyIds', replyIds)

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
      await watchThread()
      setIsInitialized(true)
    }

    init()

  },[
    fetchPosts,
    isInitialized,
    watchThread,
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

