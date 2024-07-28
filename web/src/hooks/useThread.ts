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
export const useThread = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const walletClient = useWalletClient()

  //const walletClient = useWalletClient()
  const [posts, setPosts] = useState([])
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
  const fetchPosts = useCallback(async () => {
    if (publicClient && address) {
      publicClient.getLogs({
        address: hashChanAddress as `0x${string}`,
        eventName: parseAbiItem('event Comment(address indexed, bytes32 indexed, bytes32, bytes32, string, string)'),
        fromBlock: 0n,
        toBlock: 'latest'
      }).then((logs) => {
        console.log(logs)
      })
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

  return {
    posts,
    createThread,
    fetchPosts
  }

}

