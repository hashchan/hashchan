import {
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { useContracts } from '@/hooks/useContracts'
import { 
  usePublicClient,
  useAccount,
  useBlockNumber } from 'wagmi'

  import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
  import { config } from '@/config'
  import { IDBContext } from '@/provider/IDBProvider'
  import { parseEventLogs, getContract } from 'viem'


  export const useBoards = () => {
    const [isInitialized, setIsInitialized] = useState(false)
    const { db } = useContext(IDBContext)

    const { address, chain } =  useAccount()
    const blockNumber = useBlockNumber();
    const { hashchan } = useContracts()
    const publicClient = usePublicClient()

    const [boards, setBoards] = useState([])
    const [favouriteBoards, setFavouriteBoards] = useState([])
    const [logErrors, setLogErrors] = useState([])


    const fetchFavouriteBoards = useCallback(async () => {
      if (db && chain) {
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
    }, [db, chain])


    const fetchBoards = useCallback(async (cacheOnly: boolean) => {
      console.log('fetching boards')
      if ( db && hashchan && chain && blockNumber) {
        let boards = []
        let boardsSync = await db.boardsSync.where('chainId').equals(chain.id).first()


        if (typeof boardsSync === 'undefined') {
          boardsSync = {
            chainId: chain.id,
            lastSynced: 0,
            boardIterator: 0
          }
          await db.boardsSync.add(boardsSync)
        }
          try {
            boards = await db.boards.where('chainId').equals(chain.id).toArray()
            console.log('boards', boards)
          } catch (e) {
            console.log('e', e)
            console.log('db error, skipping')
          }
          try {
            if (!cacheOnly) {
              const boardIterator = await hashchan.read.boardCount()
              console.log("boardsSync", boardsSync)
              console.log("boardIterator", boardIterator)

              for (let i = boardsSync.boardIterator; i < boardIterator; i++) {
                const [boardName, boardSymbol] = await hashchan.read.boards([i])

                const exist = await db.boards.where('[boardId+chainId]').equals([i, chain.id]).first()
                console.log('exist', Boolean(exist) )
                if (!exist) {
                  const board = {
                    boardId: Number(i),
                    chainId: chain.id,
                    favourite: 0,
                    name: boardName,
                    symbol: boardSymbol,
                    lastSynced: 0
                  }
                  await db.boards.add(board)
                  boards.push(board)
                }
              }

              console.log('setting boards: ', boards)
              setBoards(boards)
              await db.boardsSync.where('chainId').equals(chain.id).modify({
                lastSynced: Number(blockNumber.data),
                boardIterator: Number(boardIterator)
              })
            }

          } catch (e) {
            console.log('e', e)
            setLogErrors(old => [...old, e.toString()])

          }
        }
      }, [
        chain,
        db,
        hashchan,
        blockNumber.data,
      ])

      const toggleFavourite = useCallback(async (board) => {
        if (db) {
          try {
            await db.boards.where('[boardId+chainId]').equals([board.boardId, board.chainId]).modify({favourite: board.favourite === 1 ? 0 : 1})
          } catch (e) {
            console.log('e', e)
            console.log('db error, skipping')
          }
          fetchFavouriteBoards()
          fetchBoards(true)
        } 
      }, [db, fetchFavouriteBoards, fetchBoards])


      useEffect(() => {
        setIsInitialized(false)
      }, [chain?.id])

      useEffect(() => {
        if (
          isInitialized ||
          !chain ||
          !address ||
          !db ||
          !blockNumber.data
        ) return
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
