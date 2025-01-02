import { type WalletClient } from 'viem'
export const tryRecurseBlockFilter = async (
  publicClient,
  filterArgs,
  i = 0,
  maxRetry = 3
) => {
    try {
        return {
          filter: await publicClient.createContractEventFilter(filterArgs),
          isReduced: i > 0 ? true : false
        }
    } catch (e) {
        console.log('filter creation failed: ', e)
        
        if (i >= maxRetry) {
            throw new Error(`Max retries (${maxRetry}) exceeded`)
        }

        const newFilterArgs = {
            address: filterArgs.address,
            abi: filterArgs.abi,
            eventName: filterArgs.eventName,
            args: filterArgs.args,
            fromBlock: filterArgs.toBlock - (99990n / BigInt(i + 1)),
            toBlock: filterArgs.toBlock
        }
        
        await new Promise(resolve => setTimeout(resolve, 400))
        return await tryRecurseBlockFilter(publicClient, newFilterArgs, i + 1, maxRetry)
    }
}

export const getWalletInterface = ({
  address,
  walletClient
}:{
  address: `0x${string}`,
  walletClient: WalletClient
}) => {
  return {
    address: address,
    getAddress: () => address,
    signMessage: async (message: string) => {
      const oldSig = localStorage.getItem(address)
      if (oldSig) return oldSig
      const signature = await walletClient.signMessage({
        message,
        account: address
      })
      localStorage.setItem(address, signature)
      return signature
    }
  }
}
