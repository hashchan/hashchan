import {useState, useEffect, useCallback} from 'react'
import {
  useAccount,
  usePublicClient,
  useWatchContractEvent,
  useWalletClient
} from 'wagmi'
import { writeContract,waitForTransactionReceipt  } from '@wagmi/core'
import { address as hashChanAddress, abi } from '@/assets/HashChan.json'
import { parseAbiItem, parseEventLogs } from 'viem'

import { boardsMap } from '@/utils'
import { config } from '@/config'
export const useThread = (threadId: string) => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [op, setOp] = useState(null)
  const [posts, setPosts] = useState([])
  const [logErrors, setLogErrors] = useState([])
  const watchThread = useCallback(async () => {
    if (publicClient && address) {
      try {
        const unwatch = publicClient.watchContractEvent({
          address: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Comment',
          args: {
            threadId
          },
          onLogs(logs) {
            const post = {
              creator: logs[0].args.creator,
              id: logs[0].args.id,
              imgUrl: logs[0].args.imgUrl,
              content: logs[0].args.content,
              timestamp: Number(logs[0].args.timestamp)
            }
            setPosts(old => [...old, post])
          }
        })

      } catch (e) {
        console.log('logErrors', e)
        setLogErrors(old => [...old, e.toString()])
      }
    }  
  }, [publicClient, address, threadId])



  const fetchThread = useCallback(async () => {
    if (publicClient && address) {
      try {
        const filter = await publicClient.createContractEventFilter({
          address: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Thread',
          //event: parseAbiItem("event Thread(uint8 indexed, address indexed, bytes32 indexed, string, string, string, uint256)"),
          args: {
            id: threadId
          },
          fromBlock: 0n,
          toBlock: 'latest'
        })

        const logs = await publicClient.getFilterLogs({
          filter,
        })
        console.log('logs 60 op', logs)
        setOp({
          creator: logs[0].args.creator,
          id: logs[0].args.id,
          imgUrl: logs[0].args.imgUrl,
          title: logs[0].args.title,
          content: logs[0].args.content,
          timestamp: Number(logs[0].args.timestamp)

        })

      } catch (e) {
        console.log('logErrors', e.toString())
        setLogErrors(old => [...old, e.toString()])
      }
    }
  }, [publicClient, address, threadId])
  const fetchPosts = useCallback(async () => {
    if (publicClient && address && threadId) {
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
        const initialPosts = logs.map((log) => {
          return {
            creator: log.args.creator,
            id: log.args.id,
            imgUrl: log.args.imgUrl,
            content: log.args.content,
            timestamp: Number(log.args.timestamp)
          }
        })

        setPosts(initialPosts)

        console.log('post logs', logs)

      } catch (e) {
        console.log('logErrors', e.text)
        setLogErrors(old => [...old, e.toString()])
      }

    }
  }, [publicClient, address, threadId])
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
        console.log(result)
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
  }, [walletClient, address, threadId])


  useEffect(() => {
    if (threadId) {
      fetchThread()
      fetchPosts()
      watchThread()
    }
  }, [threadId, fetchThread, fetchPosts, watchThread])

  return {
    op: op,
    posts: posts,
    fetchPosts: fetchPosts,
    createPost: createPost,
    logErrors: logErrors
  }

}

