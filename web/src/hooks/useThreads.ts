import {
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import {
  useAccount,
  usePublicClient,
  useWatchContractEvent,
  useBlockNumber
}  from 'wagmi'
import { writeContract  } from '@wagmi/core'
import { useContract } from '@/hooks/useContract'
import { parseAbiItem } from 'viem'
import { config } from '@/config'
import { boardsMap } from '@/utils'


import { IDBContext } from '@/provider/IDBProvider'

export const useThreads = ({board}: {board: string}) => {
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient({config});
  const blockNumber = useBlockNumber();

  const { contractAddress, abi } = useContract()
  const [logErrors, setLogErrors] = useState([])
  //const walletClient = useWalletClient()
  const [threads, setThreads] = useState([])
  
  const fetchThreads = useCallback(async () => {
    console.log('fetching threads')
    if (publicClient && address && board && chain && db) {
      let threads;
      try {
        threads = await db.threads.where('boardId').equals(boardsMap[board]).toArray()
      } catch (e) {
        console.log('e', e)
        console.log('db error, skipping')
      }
      try {
        const filter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewThread',
          args: {
            board: boardsMap[board]
          },
          fromBlock: 0n,
          toBlock: blockNumber.data
        })

        const logs = await publicClient.getFilterLogs({
          filter,
        })

        const threads = logs.map((log) => {
          const {
            creator,
            id,
            imgUrl,
            title,
            content,
            timestamp
          } = log.args

          return {
            creator,
            id,
            imgUrl,
            title,
            content,
            timestamp: Number(timestamp),
          }
        })
        setThreads(threads)
      } catch (e) {
        console.log('log error', e)
        setLogErrors(old => [...old, e.toString()])
      }
    }
  }, [publicClient, address, board, chain, contractAddress, abi, blockNumber, db])

  const watchThreads = useCallback(async () => {
   if (publicClient && address && chain) {
     try {
     const unwatch = publicClient.watchContractEvent({
       address: contractAddress,
       abi,
       eventName: 'NewThread',
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
  }, [publicClient, address, board, chain, contractAddress, abi])

  useEffect(() => {
    if (!isInitialized || !address || !chain || !db ) return 
      const init = async () => {
        console.log('initing')
        await fetchThreads()
        await watchThreads()
        setIsInitialized(true)
      }

      init()

  }, [isInitialized, address, chain, db, fetchThreads, watchThreads])
  return {
    threads,
    fetchThreads,
    logErrors
  }

}

