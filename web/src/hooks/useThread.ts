import {useState, useEffect, useCallback} from 'react'
import { useAccount, usePublicClient, useWatchContractEvent } from 'wagmi'
import { address as hashChanAddress, abi } from '@/assets/HashChan.json'
import { parseAbiItem } from 'viem'

export const useThread = (threadId:string) => {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  //const walletClient = useWalletClient()
  const [posts, setPosts] = useState([])
  useWatchContractEvent({
    address: hashChanAddress,
    abi,
    args: {
      threadId: threadId
    },
    eventName: 'Comment',
    onLogs(logs) {
      console.log(logs)
    }
  })
  const fetchPosts = useCallback(async () => {
    if (publicClient && address) {
      publicClient.getLogs({
        address: hashChanAddress,
        eventName: parseAbiItem('event Comment(address indexed, bytes32 indexed, bytes32, bytes32, string, string)'),
        fromBlock: 0n,
        toBlock: 'latest'
      }).then((logs) => {
        console.log(logs)
      })
    }
  }, [publicClient, address])
  
  return {
    posts,
    fetchPosts
  }

}

