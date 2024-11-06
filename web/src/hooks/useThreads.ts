import {useState, useEffect, useCallback} from 'react'
import { useAccount, usePublicClient, useWatchContractEvent, useBlockNumber } from 'wagmi'
import { writeContract  } from '@wagmi/core'
import { address as hashChanAddress, baseAddress, abi } from '@/assets/HashChan.json'
import { parseAbiItem } from 'viem'
import { config } from '@/config'
import { boardsMap } from '@/utils'
export const useThreads = ({board}: {board: string}) => {
  const { address, chain } = useAccount()
  const publicClient = usePublicClient({config});
  const blockNumber = useBlockNumber();
  const [logErrors, setLogErrors] = useState([])
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
    if (publicClient && address && board && chain) {
      try {
        console.log("brave debug: fetching threads")
        console.log('brave debug publicClient', publicClient)
        console.log('brave debug window.ethereum', window.ethereum)
        const filter = await publicClient.createContractEventFilter({
          address: chain.name === 'Base' ?  baseAddress as `0x${string}`: hashChanAddress as `0x${string}`,
          abi,
          eventName: 'Thread',
          args: {
            board: boardsMap[board]
          },
          fromBlock: 0n,
          toBlock: 'latest'
        })
        console.log('brave debug: filter created')


        const logs = await publicClient.getFilterLogs({
          filter,
        })
        console.log('brave debug: logs fetched', logs)

        const threads = logs.map((log) => {
          const { creator, id, imgUrl, title, content, timestamp } = log.args
          return {
            creator,
            id,
            imgUrl,
            title,
            content,
            timestamp: Number(timestamp),
          }
        })
        console.log('brave debug: threads parsed', threads)

        setThreads(threads)

      } catch (e) {
        console.log('log error', e)
        setLogErrors(old => [...old, e.toString()])
      }
    }
  }, [publicClient, address, board, chain])

  const watchThreads = useCallback(async () => {
   if (publicClient && address && chain) {
     try {
     const unwatch = publicClient.watchContractEvent({
       address: chain.name === 'Base' ?  baseAddress as `0x${string}`: hashChanAddress as `0x${string}`,
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

     } catch (e) {
        console.log('log error', e)
       setLogErrors(old => [...old, e.toString()])
     }
   }
  }, [publicClient, address, board, chain])

  useEffect(() => {
    if (publicClient && address && board ) {
      fetchThreads()
      watchThreads()
    }
  }, [publicClient, address, board, watchThreads, fetchThreads])
  return {
    threads,
    fetchThreads,
    logErrors
  }

}

