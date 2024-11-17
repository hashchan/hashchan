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

export const useThread = (threadId: string) => {
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
    if (publicClient && address && threadId && chain) {
      try {
        unwatch = publicClient.watchContractEvent({
          address: contractAddress,
          abi,
          eventName: 'NewPost',
          fromBlock: 0n,
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
  }, [publicClient, address, threadId, chain, contractAddress, abi])


  const fetchPosts = useCallback(async () => {
    if (publicClient && address && threadId && chain && db) {
      console.log('trying to fetch posts')
      setLastBlock(await publicClient.getBlockNumber())

      const threadFilter = await publicClient.createContractEventFilter({
        address: contractAddress,
        abi,
        eventName: 'NewThread',
        args: {
          id: threadId
        },
        fromBlock: 0n,
        toBlock: blockNumber.data
      })

      const threadLogs = await publicClient.getFilterLogs({
        filter: threadFilter,
      })
      console.log('threadLogs', threadLogs)

      const { creator, id, imgUrl, content, timestamp } = threadLogs[0].args

      const localRefsObj = {
        [id] : createRef(),
      }
      const localLogsObj = {
        [id]: {
          creator,
          id,
          imgUrl,
          content: sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] }),
          timestamp: Number(timestamp),
          replies: [],
          ref: localRefsObj[id]
        }
      }

      try {
        const filter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewPost',
          fromBlock: 0n,
          toBlock: blockNumber.data,
          args: {
            threadId: threadId
          }
        })
        console.log('hitting api')
        const logs = await publicClient.getFilterLogs({
          filter
        })

        logs.forEach((log) => {
          console.log('log', log)
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
          console.log('replyids', replyIds)
          replyIds.forEach((replyId, i) => {
            localLogsObj[replyId].replies.push({ref: localRefsObj[id], id})
          })
          //localLogsObj[log.args.id].content = parsed
          localLogsObj[id].content = sanitizeMarkdown(content, { allowedTags: ['p', 'div', 'img'] })
        })
        setPosts(Object.values(localLogsObj))
        //await db.threads.bulkPut(Object.values(localLogsObj))
        console.log('posts', Object.values(localLogsObj))
        setLogsObj(localLogsObj)
        setRefsObj(localRefsObj)
      } catch (e) {
        console.log('logErrors', e.text)
        setLogErrors(old => [...old, e.toString()])
      }

    }
  }, [publicClient, address, threadId, chain, contractAddress, abi, blockNumber.data, db])


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

        const id = await db.threads.add({
          id: logs[0].args.id,
          creator: logs[0].args.creator,
          imgUrl: logs[0].args.imgUrl,
          content: logs[0].args.content,
          timestamp: logs[0].args.timestamp
        })
        
        console.log('dexie id: ', id)

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
    abi,
    db
  ])


  useEffect(() => {
    if (isInitialized || !address || !chain || !db) return
    const init = async () => {
      await fetchPosts()
      await watchThread()
      setIsInitialized(true)
    }

    init()

  },[address, chain, fetchPosts, isInitialized, watchThread, db])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

