import { type WalletClient } from 'viem'

export const tryRecurseBlockFilter = async (
  publicClient: any,
  filterArgs: any,
  i = 0,
  maxRetry = 3
): Promise<{ filter: any; isReduced: boolean }> => {
  try {
    return {
      filter: await publicClient.createContractEventFilter(filterArgs),
      isReduced: i > 0,
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
      fromBlock: filterArgs.toBlock - 99990n / BigInt(i + 1),
      toBlock: filterArgs.toBlock,
    }

    await new Promise((resolve) => setTimeout(resolve, 400))
    return tryRecurseBlockFilter(publicClient, newFilterArgs, i + 1, maxRetry)
  }
}

export const getWalletInterface = ({
  address,
  walletClient,
}: {
  address: `0x${string}`
  walletClient: WalletClient
}) => ({
  address,
  getAddress: () => address,
  signMessage: async (message: string) => {
    const cached = localStorage.getItem(address)
    if (cached) return cached
    const signature = await walletClient.signMessage({ message, account: address })
    localStorage.setItem(address, signature)
    return signature
  },
})

export const chainIdToName = (chainId: number): string => {
  switch (chainId) {
    case 1: return 'Ethereum'
    case 10: return 'OP Mainnet'
    case 61: return 'Ethereum Classic'
    case 8453: return 'Base'
    case 11155111: return 'Sepolia'
    case 25363: return 'Fluent'
    default: return 'Unknown'
  }
}
