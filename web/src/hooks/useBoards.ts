import {
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { useContract } from '@/hooks/useContract'
import { usePublicClient, useAccount, useBlockNumber } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/config'
import { IDBContext } from '@/provider/IDBProvider'
import { parseEventLogs } from 'viem'


export const useBoards = () => {
  const [isInitialized, setIsInitialized] = useState(false)
  const { db } = useContext(IDBContext)
  
  const { address, chain } =  useAccount()
  const blockNumber = useBlockNumber();
  const { contractAddress, abi } = useContract()
  const publicClient = usePublicClient()
  
  const [boards, setBoards] = useState([])
  const [favouriteBoards, setFavouriteBoards] = useState([])
  const [logErrors, setLogErrors] = useState([])


  const fetchFavouriteBoards = useCallback(async () => {
   if (address && chain && publicClient && db) {
     let boards = []
     try {
       boards = await db.boards.where('favourite').equals(1).toArray()
     } catch (e) {
       console.log('e', e)
       console.log('db error, skipping')
     }
     setFavouriteBoards(boards)
     return boards
   }
  }, [address, chain, publicClient, db])
  

  const fetchBoards = useCallback(async () => {
    if (address && chain && publicClient && db) {
      let boards = []
      let lastBlock = await db.boardsSync.where('chainId').equals(chain.id).first()
      
      if (typeof lastBlock === 'undefined') {
        await db.boardsSync.add({chainId: chain.id, lastSynced: 0})
        lastBlock = { chainId: chain.id, lastSynced: 0 }
      }
      try {
        boards = await db.boards.where('chainId').equals(chain.id).toArray()
      } catch (e) {
        console.log('e', e)
        console.log('db error, skipping')
      }
      try {
       const boardsFilter = await publicClient.createContractEventFilter({
         address: contractAddress,
         abi,
         eventName: 'NewBoard',
         fromBlock: BigInt(lastBlock.lastSynced),
         toBlock: blockNumber.data
       })

       const boardLogs = await publicClient.getFilterLogs({
         filter: boardsFilter
       })
       boardLogs.forEach(async (log) => {
         console.log('log', log)
         const { id, name, symbol } = log.args
         const board = {
           boardId: Number(id),
           chainId: chain.id,
           favourite: 0,
           name,
           symbol
         }
         await db.boards.add({
           lastSynced: 0,
           ...board
         })
         boards.push(board)
       })

       setBoards(boards)
       await db.boardsSync.update(chain.id, {'lastSynced': Number(blockNumber.data)})
      } catch (e) {
        console.log('e', e)
        setLogErrors(old => [...old, e.toString()])

      }
    }
  }, [
    address,
    chain,
    publicClient,
    db,
    blockNumber.data,
    contractAddress,
    abi
  ])
  
  const toggleFavourite = useCallback(async (board) => {
    console.log('toggling favourite', board)
    if (address && chain && publicClient && db) {
      try {
        await db.boards.where('[symbol+chainId]').equals([board.symbol, board.chainId]).modify({favourite: board.favourite === 1 ? 0 : 1})
      } catch (e) {
        console.log('e', e)
        console.log('db error, skipping')
      }
      fetchFavouriteBoards()
      fetchBoards()
    } 
  }, [address, chain, publicClient, db, fetchFavouriteBoards, fetchBoards])

  useEffect(() => {
    setIsInitialized(false)
  }, [contractAddress])

  useEffect(() => {
    if (isInitialized || !chain || !address || !db || !blockNumber.data) return
      const init = async () => {
        await fetchBoards()
        await fetchFavouriteBoards()
        setIsInitialized(true)
      }

      init()
  }, [
    isInitialized,
    chain,
    address,
    db,
    fetchBoards,
    fetchFavouriteBoards,
    blockNumber.data
  ])

  return {
    boards,
    toggleFavourite,
    favouriteBoards,
    logErrors,
    fetchBoards,
    fetchFavouriteBoards
  }

}
