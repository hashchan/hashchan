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

import { useBoards } from './useBoards'
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
    console.log(
      Boolean(publicClient),
      Boolean(address),
      Boolean(board),
      Boolean(chain), 
      Boolean(db),
      Boolean(blockNumber),
      Boolean(abi),
      Boolean(contractAddress),
    )
    if (
      publicClient &&
      address &&
      board &&
      chain &&
      db &&
      blockNumber &&
      abi &&
      contractAddress &&
      board
    ) {
      // needs to fetch board by unique ID
      console.log('board', board)
      console.log('boardsMap[board]', boardsMap[board])
      let boardCache = await db.boards.where('symbol').equals(board).first()
      console.log('boardCache', boardCache)
      const threads = await db.threads.where('boardId').equals(boardsMap[board]).toArray()
      console.log('threads', threads)
      try {
        const filter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewThread',
          args: {
            board: boardCache.id
          },
          fromBlock: BigInt(boardCache.lastSynced ? boardCache.lastSynced : 0),
          toBlock: blockNumber.data
        })

        const logs = await publicClient.getFilterLogs({
          filter,
        })


        logs.forEach(async (log) => {
          const {
            board:boardId,
            creator,
            id,
            imgUrl,
            title,
            content,
            timestamp
          } = log.args
          threads.push({
            lastSynced: 0,
            boardId: Number(boardId),
            id,
            creator,
            imgUrl,
            title,
            content,
            timestamp: Number(timestamp)
          })
          await db.threads.add(threads[threads.length - 1])
        })
        
        await db.boards.update(boardCache.id, {lastSynced: blockNumber.data})
        setThreads(threads)

      } catch (e) {
        console.log('log error', e)
        setLogErrors(old => [...old, e.toString()])
      }
    }
  }, [
    publicClient,
    address,
    board,
    chain,
    contractAddress,
    abi,
    blockNumber,
    db
  ])

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
    setIsInitialized(false)
  },[board])


  useEffect(() => {
    if (isInitialized || !address || !chain || !db || !blockNumber || !abi || !contractAddress || !board ) return 

    const init = async () => {
      await fetchThreads()
      await watchThreads()
      setIsInitialized(true)
    }

    init()

  }, [
    isInitialized,
    address,
    chain,
    db,
    fetchThreads,
    watchThreads,
    blockNumber,
    abi,
    contractAddress,
    board,
  ])


  return {
    threads,
    fetchThreads,
    logErrors
  }

}

