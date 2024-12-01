import {
  useContext,
  useState,
  useEffect,
  useCallback,
  createRef
} from 'react'
import { LogsContext } from '@/provider/LogsProvider/LogsProvider'
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
import { useParams } from 'react-router-dom'
import  sanitizeMarkdown  from 'sanitize-markdown'
import { parseContent } from '@/utils'

export const useThread = () => {
  const {chainId:chainIdParam, boardId:boardIdParam, threadId:threadIdParam} = useParams()
  const [isInitialized, setIsInitialized] = useState(false)
  const { db, fetchLogs } = useContext(LogsContext)
  const { address, chain } = useAccount()
  const blockNumber = useBlockNumber();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { contractAddress, abi, firstBlock } = useContract()


  const fetchPosts = useCallback(async () => {
    if (
        publicClient &&
        address &&
        threadIdParam &&
        chain &&
        db &&
        boardIdParam &&
        blockNumber.data &&
        contractAddress &&
        abi &&
        firstBlock
    ) {
      const cachedThread = await db.threads.where('threadId').equals(threadIdParam).first()
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
        console.log('thread', thread)
      } else {
        //fetching thread from event logs
        const threadFilter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewThread',
          args: {
            id: threadIdParam
          },
          fromBlock: BigInt(firstBlock),
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
        const cachedPosts = await db.posts.where('threadId').equals(threadIdParam).sortBy('timestamp')

        console.log('cached posts', cachedPosts)

        if (cachedPosts.length > 0) {
          cachedPosts.forEach((post) => {
            post.replies = []
            localRefsObj[post.postId] = createRef()
            localLogsObj[post.postId] = {
              ...post,
              ref: localRefsObj[post.postId]
            }
            post.replyIds.forEach((ri) => {
              localLogsObj[ri].replies.push({ref: localRefsObj[post.postId], id: post.postId})
            })
          })
        }
        console.log('last synced', thread.lastSynced)
        console.log('to block', blockNumber.data)
        const filter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewPost',
          fromBlock: BigInt(thread.lastSynced ? thread.lastSynced - 1 : firstBlock),
          toBlock: blockNumber.data,
          args: {
            threadId: threadIdParam
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
              boardId: boardIdParam,
              threadId: threadIdParam,
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
        const update = await db.threads.where('threadId').equals(threadIdParam).modify({
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
    threadIdParam,
    boardIdParam,
    chain,
    contractAddress,
    abi,
    blockNumber.data,
    db,
    firstBlock
  ])


  const createPost = useCallback(async (
    imgUrl: string,
    content: string,
    replyIds: string[]
  ) => {
    if (boardIdParam && threadIdParam && publicClient && walletClient && address && chain) {
      try {

        const hash = await writeContract(config, {
          address: contractAddress as `0x${string}`,
          abi,
          functionName: 'createPost',
          args: [
            boardIdParam,
            threadIdParam,
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
        console.log('logs', logs)

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
    threadIdParam,
    chain,
    contractAddress,
    abi,
    boardIdParam,
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
      !boardIdParam ||
      !threadIdParam
    ) return


    const init = async () => {
      await fetchPosts()
      console.log('setting up watch')
      console.log('blockNumber.data', blockNumber.data)
      const unwatch = publicClient.watchContractEvent({
        address: contractAddress,
        abi,
        eventName: 'NewPost',
        fromBlock: blockNumber.data - 2n,
        args: {
          threadId: threadIdParam
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
            console.log('hi inside watch')
            setPosts(old => [...old, post])
            db.posts.add(post)

            return oldRefs
          })
        }
      })
      setIsInitialized(true)
    }
    init()

  },[
    fetchPosts,
    isInitialized,
    publicClient,
    address,
    threadIdParam,
    chain,
    contractAddress,
    abi,
    blockNumber.data,
    db,
    boardIdParam
  ])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

