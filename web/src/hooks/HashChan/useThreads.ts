import {
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react'
import {
  useAccount,
  usePublicClient,
  useBlockNumber
}  from 'wagmi'
import { useContracts } from '@/hooks/useContracts'
import { config } from '@/config'
import { IDBContext } from '@/provider/IDBProvider'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { useParams } from 'react-router-dom'
import { tryRecurseBlockFilter } from '@/utils/blockchain'


export const useThreads = () => {
  const { board } = useBoard()
  const { boardId, chainId } = useParams()
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient({config});
  const blockNumber = useBlockNumber();

  const { contractAddress, abi } = useContracts()
  const [logErrors, setLogErrors] = useState([])
  //const walletClient = useWalletClient()
  const [threads, setThreads] = useState([])
  const [isReducedMode, setIsReducedMode] = useState(false)



  const fetchThreads = useCallback(async () => {
    if (
      publicClient &&
      address &&
      chain &&
      db &&
      blockNumber &&
      abi &&
      contractAddress &&
      boardId &&
      chainId &&
      board
    ) {
      // needs to fetch board by unique ID
      const threads = await db.threads
      .where(['boardId+chainId'])
      .equals([Number(boardId), Number(chainId)]).toArray()
        console.log('blockNumber', blockNumber.data)
        console.log('board.lastSynced', board.lastSynced)
        if (blockNumber.data > board.lastSynced) {
          
          const startingFilterArgs = {
            address: contractAddress,
            abi,
            eventName: 'NewThread',
            args: {
              'board': `0x${BigInt(board.boardId).toString(16)}`
            },
            fromBlock: BigInt(board.lastSynced ? board.lastSynced : 0),
            toBlock: blockNumber.data
          }

          const {filter, isReduced} = await tryRecurseBlockFilter(publicClient, startingFilterArgs)
          setIsReducedMode(isReduced)
          console.log()
          console.log('filter', filter)

          try {
            const logs = await publicClient.getFilterLogs({
              filter,
            })
            console.log('logs', logs) 
            logs.forEach(async (log) => {
              const {
                boardId,
                creator,
                threadId,
                imgUrl,
                title,
                content,
                timestamp
              } = log.args
              threads.push({
                lastSynced: 0,
                boardId: Number(boardId),
                threadId,
                creator,
                imgUrl,
                title,
                content,
                chainId: chain.id,
                timestamp: Number(timestamp)
              })
              await db.threads.add(threads[threads.length - 1])
          })
          await db.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).modify({'lastSynced': blockNumber.data})
          } catch (e) {
            console.log('log error', e)
            setLogErrors(old => [...old, e.toString()])
          }

        }

        setThreads(threads)
    }
  }, [
    publicClient,
    address,
    board,
    chain,
    contractAddress,
    abi,
    blockNumber,
    db,
    boardId,
    chainId
  ])

  const watchThreads = useCallback(async () => {
   if (publicClient && address && chain && board && blockNumber && abi && contractAddress) {
     try {
     const unwatch = publicClient.watchContractEvent({
       address: contractAddress,
       abi,
       eventName: 'NewThread',
       //fromBlock: blockNumber.data,
       args: {
         board: board.boardId
       },
       onLogs(logs) {
         console.log("watch Threads:", logs)
         const thread = {
           title: logs[0].args.title,
           creator: logs[0].args.creator,
           threadId: logs[0].args.threadId,
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
  }, [
    publicClient,
    address,
    board,
    chain,
    contractAddress,
    abi,
    blockNumber,
  ])

  useEffect(() => {
    setIsInitialized(false)
  },[boardId])


  useEffect(() => {
    if (
      isInitialized ||
      !address ||
      !chain ||
      !db ||
      !blockNumber ||
      !abi ||
      !contractAddress ||
      !boardId ||
      !chainId ||
      !board
   ) return 

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
    board,
    fetchThreads,
    watchThreads,
    blockNumber,
    abi,
    contractAddress,
    boardId,
    chainId
  ])


  return {
    threads,
    fetchThreads,
    logErrors,
    isReducedMode
  }

}