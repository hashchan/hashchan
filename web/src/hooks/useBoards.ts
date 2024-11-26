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
        boards = await db.boards
        .where(['chainId+favourite'])
        .equals([chain.id, 1]).toArray()
      } catch (e) {
        console.log('e', e)
        console.log('db error, skipping')
      }
      setFavouriteBoards(boards)
      return boards
    }
  }, [address, chain, publicClient, db])


  const fetchBoards = useCallback(async (cacheOnly: boolean) => {
    if (address && chain && publicClient && db && contractAddress) {
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
        if (!cacheOnly) {
          const boardsFilter = await publicClient.createContractEventFilter({
            address: contractAddress,
            abi,
            eventName: 'NewBoard',
            fromBlock: BigInt(lastBlock.lastSynced ? lastBlock.lastSynced : 0),
            toBlock: blockNumber.data
          })

          const boardLogs = await publicClient.getFilterLogs({
            filter: boardsFilter
          })
          boardLogs.forEach(async (log) => {
            const { id, name, symbol } = log.args
            const board = {
              boardId: Number(id),
              chainId: chain.id,
              favourite: 0,
              name,
              symbol
            }
            const exist = await db.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).first()
            if (!exist) {
              await db.boards.add({
                lastSynced: 0,
                ...board
              })
              boards.push(board)
            }
          })
          
        }

        setBoards(boards)
        await db.boardsSync.where('chainId').equals(chain.id).modify({lastSynced: Number(blockNumber.data)})

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
    if (address && chain && publicClient && db) {
      try {
        await db.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).modify({favourite: board.favourite === 1 ? 0 : 1})
      } catch (e) {
        console.log('e', e)
        console.log('db error, skipping')
      }
      fetchFavouriteBoards()
      fetchBoards(true)
    } 
  }, [address, chain, publicClient, db, fetchFavouriteBoards, fetchBoards])


  useEffect(() => {
    setIsInitialized(false)
  }, [contractAddress, chain?.id])

  useEffect(() => {
    if (isInitialized || !chain || !address || !db || !blockNumber.data) return
      const init = async () => {
        await fetchBoards(false)
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
