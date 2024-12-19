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
import { useContracts } from '@/hooks/useContracts'
import { useParams } from 'react-router-dom'
import  sanitizeMarkdown  from 'sanitize-markdown'
import { parseContent } from '@/utils/content'
import { tryRecurseBlockFilter } from '@/utils/blockchain'
import { computeImageCID } from '@/utils/cids'
import { ModerationServicesContext } from '@/provider/ModerationServicesProvider'

export const useThread = () => {
  const {chainId:chainIdParam, boardId:boardIdParam, threadId:threadIdParam} = useParams()
  const [isInitialized, setIsInitialized] = useState(false)
  const { db } = useContext(IDBContext)
  const {moderationServices, orbitDbs} = useContext(ModerationServicesContext)
  const { address, chain } = useAccount()
  const blockNumber = useBlockNumber();
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { hashchan } = useContracts()

  const [isReducedMode, setIsReducedMode] = useState(false)


  const fetchPosts = useCallback(async () => {
    if (
      publicClient &&
      address &&
      hashchan &&
      threadIdParam &&
      chain?.id &&
      db &&
      boardIdParam &&
      blockNumber.data &&
      moderationServices
      //orbitDbs
    ) {
      console.log('fetchingPosts posts')
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
          janitoredBy: [],
          timestamp: Number(cachedThread.timestamp)
        }
        console.log('thread', thread)
      } else {
        //fetching thread from event logs
        const filterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewThread',
          args: {
            id: threadIdParam
          },
          fromBlock: 0n, // maybe blockheigt of deployment is better
          toBlock: blockNumber.data
        }
        const {filter:threadFilter, isReduced:isThreadReduced} = await tryRecurseBlockFilter(publicClient, filterArgs)
        setIsReducedMode(isThreadReduced)

        const threadLogs = await publicClient.getFilterLogs({
          filter: threadFilter
        })


        const { creator, content, threadId, imgUrl, imgCID, replyIds, timestamp } = threadLogs[0].args

        thread = {
          lastSynced: 0,
          creator,
          threadId,
          imgUrl,
          imgCID,
          replyIds,
          replies: [],
          janitoredBy: [],
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
          imgCID: thread.imgCID,
          content: thread.content,
          timestamp: thread.timestamp,
          replies: [],
          janitoredBy: thread.janitoredBy,
          replyIds: thread.replyIds,
          ref: localRefsObj[thread.id]
        }
      }

      try {
        let cachedPosts = await db.posts.where('threadId').equals(threadIdParam).sortBy('timestamp')

        const cachedJanitored = await db.janitored.where('threadId').equals(threadIdParam).toArray()
        console.log('cached janitored', cachedJanitored)
        console.log('cached posts', cachedPosts)
        cachedPosts = await Promise.all(cachedPosts.map(async (p) => {
          return {
            ...p,
            janitoredBy: (await Promise.all(
              Object.values(moderationServices).map(async (ms) => {
                const orbitDb = await orbitDbs[ms.address]
                console.log('orbitDb', orbitDb)
                console.log('record', await orbitDb.get(p.postId))
                if (orbitDb) {
                  return await orbitDb.get(p.postId)
                }
              })
            )).filter(item => item)
            /*
            janitoredBy: cachedJanitored.filter((j) => {
              return j.postId === p.postId
            })
             */
          }
        }))


        if (cachedPosts.length > 0) {
          cachedPosts.forEach((post) => {
            console.log('postincachedpsts', post)
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
          console.log('cachedPosts', cachedPosts)
        }
        const postFilterArgs = {
          address: hashchan.address,
          abi: hashchan.abi,
          eventName: 'NewPost',
          args: {
            threadId: threadIdParam
          },
          fromBlock: BigInt(thread.lastSynced ? thread.lastSynced - 1 : 0),
          toBlock: blockNumber.data
        }
        const {filter, isReduced} = await tryRecurseBlockFilter(publicClient, postFilterArgs)
        setIsReducedMode(isReduced)
        const logs = await publicClient.getFilterLogs({
          filter
        })

        logs.forEach(async (log) => {
          const { creator, postId, imgUrl, imgCID, content, replyIds, timestamp } = log.args
          //const { replyIds } = parseContentTwo(content, localRefsObj)
          //const { replyIds, parsed } = parseContentTwo(content, localRefsObj)
          localRefsObj[postId] = createRef()

          localLogsObj[postId] = {
            creator,
            postId,
            imgUrl,
            imgCID,
            timestamp: Number(timestamp),
            replies: [],
            janitoredBy: [],
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
              imgCID: imgCID,
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
    chain?.id,
    hashchan,
    blockNumber.data,
    db,
    orbitDbs,
    moderationServices
  ])

  useEffect(() => {
    if (orbitDbs) {
      setIsInitialized(false)
    }
  },[
    orbitDbs
  ])

  useEffect(() => {
    if (
      isInitialized ||
      !address ||
      !chain ||
      !db ||
      !publicClient ||
      !hashchan ||
      !blockNumber.data ||
      !boardIdParam ||
      !threadIdParam ||
      !moderationServices 
      //!orbitDbs
    ) return


    const init = async () => {
      await fetchPosts()
      console.log('setting up watch')
      console.log('blockNumber.data', blockNumber.data)
      const unwatch = publicClient.watchContractEvent({
        address: hashchan.address,
        abi: hashchan.abi,
        eventName: 'NewPost',
        fromBlock: blockNumber.data - 2n,
        args: {
          threadId: threadIdParam
        },
        async onLogs(logs) {
          console.log('logs', logs)
          const { creator, content, postId, imgUrl, imgCID, timestamp } = logs[0].args
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
              imgCID,
              content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
              timestamp: Number(timestamp),
              janitoredBy: [],
              replies: [],
              ref: oldRefs[postId]
            }
            console.log('hi inside watch')
            setPosts(old => [...old, post])
            //db.posts.add(post)

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
    hashchan,
    blockNumber.data,
    db,
    boardIdParam,
    moderationServices
  ])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    logErrors: logErrors,
    isReducedMode: isReducedMode,
  }

}
