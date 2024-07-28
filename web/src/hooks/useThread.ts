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
import { config } from '@/config'
export const useThread = (threadId: string) => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()
  const [op, setOp] = useState(null)
  const [posts, setPosts] = useState([])
  //const walletClient = useWalletClient()
  /*
  useWatchContractEvent({
    address: hashChanAddress as `0x${string}`,
    abi,
    args: {
      threadId: threadId
    },
    eventName: 'Comment',
    onLogs(logs) {
      console.log(logs)
    }
  })
 */

  const fetchThread = useCallback(async () => {
    if (publicClient && address) {
      const filter = await publicClient.createEventFilter({
        address: hashChanAddress as `0x${string}`,
        event: parseAbiItem("event Thread(address indexed, bytes32 indexed, string, string, string)"),
        args: {
          threadId: threadId
        }
      })

      let logs = await publicClient.getFilterLogs({
        filter
      })

      setOp({
        creator: logs[0].args[0],
        id: logs[0].args[1],
        title: logs[0].args[2],
        imgUrl: logs[0].args[3],
        content: logs[0].args[4]

      })
    }
  }, [publicClient, address])
  const fetchPosts = useCallback(async () => {
    if (publicClient && address) {
      const filter = await publicClient.createEventFilter({
        address: hashChanAddress as `0x${string}`,
        event: parseAbiItem("event Comment(address indexed, bytes32 indexed, bytes32 indexed, string, string)"),
      })

      const logs = await publicClient.getFilterLogs({
        filter
      })
      console.log('post logs', logs)

    }
  }, [publicClient, address])

  const createThread = useCallback(async (
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
          title,
          url,
          content 
        ]
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
  
  const createComment = useCallback(async (
    threadId: string,
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
    }
  }, [threadId, fetchThread, fetchPosts])

  return {
    op: op,
    posts: posts,
    createThread: createThread,
    fetchPosts: fetchPosts
  }

}

