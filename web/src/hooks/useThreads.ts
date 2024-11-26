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
import { useContract } from '@/hooks/useContract'
import { config } from '@/config'
import { IDBContext } from '@/provider/IDBProvider'
import { useBoard } from '@/hooks/useBoard'
import { useParams } from 'react-router-dom'
export const useThreads = () => {
  const { board } = useBoard()
  const { boardId, chainId } = useParams()
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
      try {
        if (blockNumber.data > board.lastSynced) {
          const filter = await publicClient.createContractEventFilter({
            address: contractAddress,
            abi,
            eventName: 'NewThread',
            args: {
              'board': `0x${BigInt(board.boardId).toString(16)}`
            },
            fromBlock: BigInt(board.lastSynced ? board.lastSynced : 0),
            toBlock: blockNumber.data
          })

          const logs = await publicClient.getFilterLogs({
            filter,
          })



          logs.forEach(async (log) => {
            const {
              board:boardId,
              creator,
              id:threadId,
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

        }

        await db.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).modify({lastSynced: blockNumber.data})
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
       fromBlock: blockNumber.data,
       args: {
         board: board.boardId
       },
       onLogs(logs) {
         const thread = {
           title: logs[0].args.title,
           creator: logs[0].args.creator,
           threadId: logs[0].args.id,
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
    logErrors
  }

}

