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
  const [logErrors, setLogErrors] = useState([])

  const fetchBoards = useCallback(async () => {
    if (address && chain && publicClient && db) {
      let boards;
      let lastBlock = await db.boardsSync.get(chain.id)
      if (typeof lastBlock === 'undefined') {
        await db.boardsSync.add({chainId: chain.id, lastSynced: 0})
        lastBlock = { chainId: chain.id, lastSynced: 0 }
      }
      try {
        boards = await db.boards.toArray()
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
         const { id, name, symbol } = log.args
         const board = {
           id: Number(id),
           chainId: chain.id,
           name,
           symbol
         }
         db.boards.add({
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

  useEffect(() => {
    setIsInitialized(false)
  }, [chain])

  useEffect(() => {
    if (isInitialized || !chain || !address || !db || !blockNumber.data) return
      const init = async () => {
        await fetchBoards()
        setIsInitialized(true)
      }

      init()
  }, [
    isInitialized,
    chain,
    address,
    db,
    fetchBoards,
    blockNumber.data
  ])

  return {
    boards,
    logErrors,
    fetchBoards
  }

}
