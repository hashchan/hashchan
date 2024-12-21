import {
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
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
  const {boardId:boardIdParam, chainId:chainIdParam} = useParams()
  const { db } = useContext(IDBContext)
  const [isInitialized, setIsInitialized] = useState(false)
  const { address, chain } = useAccount()
  const publicClient = usePublicClient({config});
  const blockNumber = useBlockNumber();

  const { hashchan } = useContracts()
  const [logErrors, setLogErrors] = useState([])
  //const walletClient = useWalletClient()
  const [threads, setThreads] = useState([])
  const [isReducedMode, setIsReducedMode] = useState(false)
  
  const unwatchRef = useRef<(() => void) | null>(null)



  const fetchThreads = useCallback(async () => {
    console.log('fetching threads')
    if (
      publicClient &&
      address &&
      db &&
      blockNumber &&
      hashchan &&
      board &&
      chain?.id
    ) {
      console.log()
      let threads = await db.threads
        .where(['boardId+chainId'])
        .equals([Number(boardIdParam), Number(chainIdParam)]).toArray()
        console.log('cached threads', threads)
        threads = await Promise.all(
          threads.map(async (thread) => {
            return {
              ...thread,
              janitoredBy: []
            }
          })
        )
        console.log('last synced', board.lastSynced)
      if (blockNumber.data > board.lastSynced) {
      //if (true == true) {
          const startingFilterArgs = {
            address: hashchan.address,
            abi: hashchan.abi,
            eventName: 'NewThread',
            args: {
              'boardId': `0x${BigInt(board.boardId).toString(16)}`
            },
            fromBlock: BigInt(board.lastSynced ? board.lastSynced : 0),
            //fromBlock: 0n,
            toBlock: blockNumber.data
          }

          const {filter, isReduced} = await tryRecurseBlockFilter(publicClient, startingFilterArgs)
          setIsReducedMode(isReduced)
          console.log()
          console.log('filter', filter)
          let logs = []
          try {
            logs = await publicClient.getFilterLogs({
              filter,
            })
          } catch (e) {
             console.log('filter error', e)
             setLogErrors(old => [...old, e.message])
          }
          console.log('logs', logs) 
          logs.forEach(async (log) => {
            const newThread = {
              lastSynced: 0,
              boardId: Number(log.args.boardId),
              threadId: log.args.threadId,
              creator: log.args.creator,
              imgUrl: log.args.imgUrl,
              imgCID: log.args.imgCID,
              title: log.args.title,
              content: log.args.content,
              janitoredBy: [],
              chainId: Number(chain.id),
              timestamp: Number(log.args.timestamp)

            }
            try {
              await db.threads.add(newThread)
            } catch (e) {
              console.log('db error', e.message)
              console.log('duplicate, skipping')
            }
            threads.push(newThread)
          })

          await db.boards.where('[boardId+chainId]')
            .equals([Number(boardIdParam), Number(chainIdParam)]).modify({'lastSynced': Number(blockNumber.data)})

        }

        setThreads(threads)

    }
  }, [
    publicClient,
    address,
    board,
    boardIdParam,
    hashchan,
    chainIdParam,
    chain?.id,
    blockNumber,
    db,
  ])

  const watchThreads = useCallback(async () => {
   if (address && board && blockNumber && hashchan) {
     try {
     const unwatch = publicClient.watchContractEvent({
       address: hashchan.address,
       abi: hashchan.abi,
       eventName: 'NewThread',
       //fromBlock: blockNumber.data,
       args: {
         boardId: board.boardId
       },
       onLogs(logs) {
         console.log("watch Threads:", logs)
         const thread = {
           title: logs[0].args.title,
           creator: logs[0].args.creator,
           threadId: logs[0].args.threadId,
           imgUrl: logs[0].args.imgUrl,
           imgCID: logs[0].args.imgCID,
           content: logs[0].args.content,
           janitoredBy: []
         }
         setThreads(old => [...old, thread])
       }
     })

     unwatchRef.current = unwatch

     } catch (e) {
        console.log('log error', e)
       setLogErrors(old => [...old, e.toString()])
     }
   }
  }, [
    publicClient,
    address,
    hashchan,
    board,
    blockNumber,
  ])

  useEffect(() => {
    setThreads([])
    console.log('reinitializing')
    setIsInitialized(false)
  },[boardIdParam])


  useEffect(() => {
    if (
      isInitialized ||
      !publicClient ||
      !address ||
      !db ||
      !blockNumber ||
      !hashchan ||
      !board ||
      !chain?.id
   ) return 

    const init = async () => {
      await fetchThreads()
      await watchThreads()
      setIsInitialized(true)
    }

    init()

  }, [
    isInitialized,
    publicClient,
    address,
    db,
    board,
    fetchThreads,
    watchThreads,
    hashchan,
    blockNumber,
    chain?.id
  ])


  useEffect(() => {
    return () => {
      if (unwatchRef.current) {
        console.log('unwatching threads')
        unwatchRef.current()
      }
    }
  },[])

  return {
    threads,
    fetchThreads,
    logErrors,
    isReducedMode
  }

}
