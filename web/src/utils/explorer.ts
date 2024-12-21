import { Chain } from 'viem'

type ExplorerType = 'transaction' | 'token' | 'address' | 'block'


export const getExplorerUrl = (
  chain: Chain,
  value: string,
  type: ExplorerType
): string => {
  if (!chain.blockExplorers?.default?.url) {
    throw new Error(`No block explorer URL found for chain ${chain.name}`)
  }

  const baseUrl = chain.blockExplorers.default.url.replace(/\/$/, '')

  switch (type) {
    case 'transaction':
      return `${baseUrl}/tx/${value}`
    case 'token':
      return `${baseUrl}/token/${value}`
    case 'address':
      return `${baseUrl}/address/${value}` 
    case 'block':
      return `${baseUrl}/block/${value}`
    default:
      throw new Error(`Invalid explorer type: ${type}`)
  }
}
