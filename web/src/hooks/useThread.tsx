import {useState, useEffect, useCallback, createRef} from 'react'

import {
  useAccount,
  usePublicClient,
  useWatchContractEvent,
  useWalletClient
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
  const [lastBlock, setLastBlock] = useState(null)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [refsObj, setRefsObj] = useState(null)
  const [logsObj, setLogsObj] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const { contractAddress, abi } = useContract()

  const watchThread = useCallback(async () => {
    let unwatch
    if (publicClient && address && threadId && chain) {
      try {
        unwatch = publicClient.watchContractEvent({
          address: contractAddress,
          abi,
          eventName: 'Comment',
          fromBlock: lastBlock ? lastBlock: await publicClient.getBlockNumber(),
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
  }, [publicClient, address, threadId, lastBlock, chain, contractAddress, abi])


  const fetchPosts = useCallback(async () => {
    console.log('trying to fetch posts')
    if (publicClient && address && threadId && chain) {
      setLastBlock(await publicClient.getBlockNumber())
      const threadFilter = await publicClient.createContractEventFilter({
        address: contractAddress,
        abi,
        eventName: 'Thread',
        args: {
          id: threadId
        },
        fromBlock: 0n,
        toBlock: await publicClient.getBlockNumber()
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
        console.log('posts', Object.values(localLogsObj))
        setLogsObj(localLogsObj)
        setRefsObj(localRefsObj)
      } catch (e) {
        console.log('logErrors', e.text)
        setLogErrors(old => [...old, e.toString()])
      }

    }
  }, [publicClient, address, threadId, chain, contractAddress, abi])


  const createPost = useCallback(async (
    imgUrl: string,
    content: string
  ) => {
    if (publicClient && walletClient && address && chain) {
      try {
        const hash = await writeContract(config, {
          address: contractAddress,
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
  }, [publicClient, walletClient, address, threadId, chain, contractAddress, abi])


  useEffect(() => {
    fetchPosts()
    watchThread()
  }, [fetchPosts, watchThread])

  return {
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

