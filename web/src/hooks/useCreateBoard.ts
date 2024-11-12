import {
  useContext,
  useState,
  useCallback,
  useEffect
} from 'react'
import { useContract } from '@/hooks/useContract2'
import { useWalletClient, useAccount } from 'wagmi'
import { writeContract, waitForTransactionReceipt } from '@wagmi/core'
import { config } from '@/config'
import { IDBContext } from '@/contexts/IDBContext'
import { parseEventLogs } from 'viem'

export useCreateBoard = () => {
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
        const tx = await writeContract(config, {
          address: contractAddress,
          abi,
          functionName: 'createBoard',
          args: [
            name,
            symbol
          ]
        })
        const('tx', tx)
        const receipt = await waitForTransactionReceipt(config, {
          hash: tx
        })
        console.log('receipt', receipt)
        const logs = parseEventLogs({
          abi,
          logs: receipt.logs
        })
        console.log('logs', logs)
        setBoardId(logs[0].args.id)

        await db.boards.add({
          id: logs[0].args.id,
          name,
          symbol,
          lastSynced: receipt.blockNumber
        })



        return  {
          hash: logs[0].args.id,
          error: null
        }
      } catch (e) {
        return {
          hash: null,
          error: e
        }
      }
    }  
  }, [address, chain, contractAddress, walletClient, abi])
}



