import { useConnect, useAccount, useDisconnect, useSwitchChain } from 'wagmi'

const truncate = (address: string) =>
  `${address.slice(0, 6)}…${address.slice(-4)}`

export const ConnectButton = () => {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const { chains, switchChain } = useSwitchChain()

  if (isConnected && address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: `${1 / Math.PHI ** 2}em` }}>
        <span style={{ color: '#19e377' }}>{truncate(address)}</span>
        <select
          value={chain?.id ?? ''}
          onChange={e => switchChain({ chainId: Number(e.target.value) })}
          style={{
            background: 'transparent',
            color: '#fff',
            border: 'none',
            fontFamily: 'inherit',
            fontSize: '1em',
            cursor: 'pointer',
            padding: 0,
            width: 'auto',
          }}
        >
          {chains.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#090909' }}>
              {c.name}
            </option>
          ))}
        </select>
        <button onClick={() => disconnect()} style={{ margin: 0, padding: `${1 / Math.PHI ** 3}em ${1 / Math.PHI ** 2}em` }}>
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => connect({ connector: connectors[0] })}
      disabled={isPending || connectors.length === 0}
      style={{ margin: 0 }}
    >
      {isPending ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}
