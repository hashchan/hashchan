import {useState, useEffect, useCallback} from 'react'
import { useAccount, usePublicClient, useWatchContractEvent, useBlockNumber } from 'wagmi'
import { writeContract  } from '@wagmi/core'
import { address as hashChanAddress, abi } from '@/assets/HashChan.json'
import { parseAbiItem } from 'viem'
import { config } from '@/config'
export const useThreads = () => {
  const { address } = useAccount()
  const publicClient = usePublicClient();
  const blockNumber = useBlockNumber()

  //const walletClient = useWalletClient()
  const [threads, setThreads] = useState([])
  /*
  useWatchContractEvent({
    address: hashChanAddress as `0x${string}`,
    abi,
    args: {
    },
    eventName: 'Thread',
    onLogs(logs) {
      console.log(logs)
    }
  })
 */
  const fetchThreads = useCallback(async () => {
    if (publicClient && address) {
      publicClient.getLogs({
        address: hashChanAddress as `0x${string}`,
        eventName: parseAbiItem('event Comment(address indexed, bytes32 indexed, bytes32, bytes32, string, string)'),
        fromBlock: BigInt(Number(blockNumber)) - 7160n,
        toBlock: 'latest'
      }).then((logs) => {
        console.log(logs)
      })
    }
  }, [publicClient, address])


  return {
    threads,
    fetchThreads
  }

}

