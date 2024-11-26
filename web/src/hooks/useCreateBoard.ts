import {
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { useContract } from '@/hooks/useContract'
import { useWalletClient, useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/config'
import { IDBContext } from '@/provider/IDBProvider'
import { parseEventLogs } from 'viem'

export const useCreateBoard = () => {
  const { db } = useContext(IDBContext)
  const { address, chain } =  useAccount()
  const { contractAddress, abi } = useContract()
  const walletClient = useWalletClient()
  const [boardId, setBoardId] = useState(null)

  const createBoard = useCallback(async (
    name: string,
    symbol: string
  ) => {
    if (walletClient && address && chain) {
      try {
        const hash = await writeContract(config, {
          address: contractAddress as `0x${string}`,
          abi,
          functionName: 'createBoard',
          args: [
            name,
            symbol
          ]
        })
        const receipt = await waitForTransactionReceipt(config, {
          hash
        })
        console.log('receipt', receipt)
        const logs = parseEventLogs({
          abi,
          logs: receipt.logs
        })
        console.log('logs', logs)
        setBoardId(logs[0].args.id)

        await db.boards.add({
          lastSynced: Number(receipt.blockNumber),
          chainId: Number(chain.id),
          boardId: Number(logs[0].args.id),
          name,
          symbol,
          favourite: 0
        })



        return  {
          receipt: receipt,
          error: null
        }
      } catch (e) {
        return {
          receipt: null,
          error: e
        }
      }
    }  
  }, [
    address,
    chain,
    contractAddress,
    walletClient,
    abi,
    db
  ])


  return {
    createBoard
  }
}



