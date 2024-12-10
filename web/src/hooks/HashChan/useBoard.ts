import {
  useState,
  useEffect,
  useCallback,
  useContext
} from 'react';

import {
  useContracts
} from '@/hooks/useContracts';

import {
  useAccount,
  usePublicClient,
  useBlockNumber
} from 'wagmi';
import { IDBContext } from '@/provider/IDBProvider';
import { useParams } from 'react-router-dom';
export const useBoard = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { boardId, chainId } = useParams();
  const { hashchan } = useContracts();
  const publicClient = usePublicClient();
  const blockNumber = useBlockNumber();

  const [board, setBoard] = useState(null);
  const { chain} = useAccount()
  const {db} = useContext(IDBContext)

  const fetchBoard = useCallback(async () => {
    console.log('fetching board')
    console.log(Boolean(chain), Boolean(db), Boolean(boardId), Boolean(chainId), Boolean(publicClient), Boolean(hashchan))
    if (
      chain &&
      db &&
      boardId &&
      chainId &&
      publicClient &&
      hashchan
    ) {
      let board
      console.log('boardId', boardId, 'chainId', chainId)
      try {
        board = await db.boards
        .where('[boardId+chainId]')
        .equals([Number(boardId), Number(chainId)])
        .first()
      console.log('board', board)
      } catch (e) {
        console.log('db error, skipping')
      }

      if (!board) {
        const logs = await hashchan.getEvents.NewBoard(
          {
            boardId: boardId
          }
        )

        /*
        const boardFilter = await publicClient.createContractEventFilter({
          address: contractAddress,
          abi,
          eventName: 'NewBoard',
          args: {
            boardId: boardId
          }
        })

        const events = await publicClient.getContractEvents({
          filter: boardFilter
        })

       */
      console.log('logs', logs)
        const log = logs[0]
        if (!log) {return}

        const { id, name, symbol } = log.args
        board = {
          boardId: Number(id),
          chainId: chain.id,
          favourite: 0,
          name,
          symbol,
          lastSynced: 0
        }

        try {
          await db.boards.add(board)
        } catch (e) {
          console.log('db error, skipping')
        }
      }
      console.log('board', board)
      setBoard(board)
    }

  }, [
    publicClient,
    chain,
    db,
    boardId,
    chainId,
    hashchan
  ]);


  useEffect(() => {
    console.log(
      Boolean(isInitialized),
      Boolean(chain),
      Boolean(db),
      Boolean(boardId),
      Boolean(chainId),
      Boolean(publicClient),
    )
    if (
      isInitialized ||
      !chain ||
      !db ||
      !boardId ||
      !chainId ||
      !publicClient 
    ) return

    const init = async () => {
      await fetchBoard()
      setIsInitialized(true)
    }

    init()

  },[
    isInitialized,
    chain,
    db,
    boardId,
    chainId,
    publicClient,
    fetchBoard
  ])

  return {
    board
  }
}
