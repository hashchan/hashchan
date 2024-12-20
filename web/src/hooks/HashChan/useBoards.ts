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
      if ( db && hashchan && chain?.id && blockNumber) {
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
          } catch (e) {
            console.log('e', e)
            console.log('db error, skipping')
          }
          try {
            if (!cacheOnly) {
              const boardIterator = await hashchan.read.boardCount()

              for (let i = boardsSync.boardIterator; i < boardIterator; i++) {
                const ethBoard = await hashchan.read.getBoard([i])

                const exist = await db.boards.where('[boardId+chainId]').equals([i, chain.id]).first()
                if (!exist) {
                  const board = {
                    boardId: Number(i),
                    chainId: chain.id,
                    favourite: 0,
                    name: ethBoard.name,
                    symbol: ethBoard.symbol,
                    description: ethBoard.description,
                    bannerUrl: ethBoard.bannerUrl,
                    bannerCID: ethBoard.bannerCID,
                    rules: ethBoard.rules,
                    lastSynced: 0
                  }
                  await db.boards.add(board)
                  boards.push(board)
                }
              }

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
        chain?.id,
        db,
        hashchan,
        blockNumber,
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
        console.log('new chain detected, refetching boards')
        setIsInitialized(false)
      }, [chain?.id])

      useEffect(() => {
        if (
          isInitialized ||
          !chain ||
          !address ||
          !db ||
          !blockNumber.data ||
          !hashchan
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
        blockNumber.data,
        hashchan
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
