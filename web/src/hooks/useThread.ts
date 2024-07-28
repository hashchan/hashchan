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

  const watchThread = useCallback(async () => {
    if (publicClient && address) {
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
            content: logs[0].args.content
          }
          setPosts(old => [...old, post])
        }
      })
    }  
  }, [publicClient, address, threadId])



  const fetchThread = useCallback(async () => {
    if (publicClient && address) {
      const filter = await publicClient.createEventFilter({
        address: hashChanAddress as `0x${string}`,
        event: parseAbiItem("event Thread(uint8 indexed, address indexed, bytes32 indexed, string, string, string)"),
        args: {
          threadId: threadId
        },
        fromBlock: 0n,
        toBlock: 'latest'
      })

      let logs = await publicClient.getFilterLogs({
        filter,
      })
      console.log('logs 60 op', logs)
      setOp({
        creator: logs[0].args[1],
        id: logs[0].args[2],
        title: logs[0].args[3],
        imgUrl: logs[0].args[4],
        content: logs[0].args[5]

      })
    }
  }, [publicClient, address])
  const fetchPosts = useCallback(async () => {
    if (publicClient && address) {
      const filter = await publicClient.createEventFilter({
        address: hashChanAddress as `0x${string}`,
        event: parseAbiItem("event Comment(address indexed, bytes32 indexed, bytes32 indexed, string, string)"),
        fromBlock: 0n,
        toBlock: 'latest',
        args: {
          threadId
        }
      })

      const logs = await publicClient.getFilterLogs({
        filter
      })
      const initialPosts = logs.map((log) => {
        return {
          creator: log.args[0],
          id: log.args[1],
          imgUrl: log.args[3],
          content: log.args[4]
        }
      })
      setPosts(initialPosts)

      console.log('post logs', logs)

    }
  }, [publicClient, address])

  const createThread = useCallback(async (
    board: string,
    title: string,
    url: string,
    content: string
  ) => {
    if (walletClient && address) {
      const hash = await writeContract(config, {
        address: hashChanAddress as `0x${string}`,
        abi,
        functionName: 'createThread',
        args: [
          boardsMap[board],
          title,
          url,
          content 
        ],
        gas: 100000n
      })
      console.log('hash', hash)
      const receipt = await waitForTransactionReceipt(config, {
       hash
      })
      console.log('receipt', receipt)
      const logs = parseEventLogs({
        abi,
        logs: receipt.logs
      })
      console.log('logs', logs)
      return logs[0].args.id
    } 
  }, [walletClient, address])
  
  const createPost = useCallback(async (
    imgUrl: string,
    content: string
  ) => {
    if (walletClient && address) {
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
      
    } 
  }, [walletClient, address])


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
    createThread: createThread,
    fetchPosts: fetchPosts,
    createPost: createPost
  }

}

