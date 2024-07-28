import {useState, useEffect, useCallback} from 'react'
import { useAccount, usePublicClient, useWatchContractEvent, useBlockNumber } from 'wagmi'
import { writeContract  } from '@wagmi/core'
import { address as hashChanAddress, abi } from '@/assets/HashChan.json'
import { parseAbiItem } from 'viem'
import { config } from '@/config'
import { boardsMap } from '@/utils'
export const useThreads = ({board}: {board: string}) => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const blockNumber = useBlockNumber()

  //const walletClient = useWalletClient()
  const [threads, setThreads] = useState([])
  /*
  useWatchContractEvent({
    address: hashChanAddress as `0x${string}`,
    abi,
    args: {
    },
    eventName: 'Thread',
    onLogs(logs) {
      console.log(logs)
    }
  })
 */
  const fetchThreads = useCallback(async () => {
    if (publicClient && address) {
      publicClient.getLogs({
        address: hashChanAddress as `0x${string}`,
        eventName: parseAbiItem('event Comment(address indexed, bytes32 indexed, bytes32, bytes32, string, string)'),
        fromBlock: BigInt(Number(blockNumber)) - 7160n,
        toBlock: 'latest'
      }).then((logs) => {
        console.log(logs)
      })
    }
  }, [publicClient, address])

  const watchThreads = useCallback(async () => {
   if (publicClient && address) {
     const unwatch = publicClient.watchContractEvent({
       address: hashChanAddress as `0x${string}`,
       abi,
       eventName: 'Thread',
       args: {
         board: boardsMap[board]
       },
       onLogs(logs) {
         const thread = {
           title: logs[0].args.title,
           creator: logs[0].args.creator,
           id: logs[0].args.id,
           imgUrl: logs[0].args.imgUrl,
           content: logs[0].args.content
         }
         setThreads(old => [...old, thread])
         console.log(logs)
       }
     })
   }
  }, [publicClient, address, board])

  useEffect(() => {
    if (publicClient && address) {
      //fetchThreads()
      watchThreads()
    }
  }, [publicClient, address, board, watchThreads])
  return {
    threads,
    fetchThreads
  }

}

