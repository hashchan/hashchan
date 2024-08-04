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
    if (publicClient && address && board) {

      const filter = await publicClient.createContractEventFilter({
        address: hashChanAddress as `0x${string}`,
        abi,
        eventName: 'Thread',
        //event: parseAbiItem('event Thread(uint8 indexed, address indexed, bytes32 indexed, string, string, string, uint256)'),
        args: {
          board: boardsMap[board]
        },
        fromBlock: 0n,
        toBlock: 'latest'
      })


      const logs = await publicClient.getFilterLogs({
        filter,
      })
      console.log('boardsMap[board]', boardsMap[board])
      console.log('logs', logs)
      const threads = logs.map((log) => {
        return {
          creator: log.args.creator,
          id: log.args.id,
          imgUrl: log.args.imgUrl,
          title: log.args.title,
          content: log.args.content,
          timestamp: Number(log.args.timestamp),

        }
      })

      setThreads(threads)
    }
  }, [publicClient, address, board])

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
         console.log('watchthreads', logs)
         const thread = {
           title: logs[0].args.title,
           creator: logs[0].args.creator,
           id: logs[0].args.id,
           imgUrl: logs[0].args.imgUrl,
           content: logs[0].args.content
         }
         setThreads(old => [...old, thread])
       }
     })
   }
  }, [publicClient, address, board])

  useEffect(() => {
    if (publicClient && address && board ) {
      fetchThreads()
      watchThreads()
    }
  }, [publicClient, address, board, watchThreads, fetchThreads])
  return {
    threads,
    fetchThreads
  }

}

