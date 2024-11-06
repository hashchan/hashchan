import { useState, useEffect } from 'react';
import { Connector, useConnect  } from 'wagmi'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName  } from 'wagmi'
import { chainIdMap } from '@/config'
import {truncateEthAddress} from '@/utils'
const Account = () => {
  const { address, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    <div >
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      <div>
        {address && <>
          <span>{chainId && chainIdMap(chainId)}</span>
          <span style={{padding: '0px 1.25vw'}}>

            {ensName ? `${ensName} (${truncateEthAddress(address)})` : truncateEthAddress(address)}
          </span>
        </>}
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    </div>
  )
}

const WalletOptions = () => {
  const { connectors, connect  } = useConnect()
  console.log('connectors', connectors)
  return (
    <div style={{
      padding:'0 1.25vw',
      display: 'flex',
      alignItems: 'center',
      }}>
      {connectors.map((connector) => (
        <WalletOption
          key={connector.uid}
          connector={connector}
          onClick={() => connect({ connector })}
        />
      ))}
    </div>
  )
}

const WalletOption = ({
  connector,
  onClick,
}: {
  connector: Connector
  onClick: () => void
})  => {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    ;(async () => {
      const provider = await connector.getProvider()
      setReady(!!provider)
    })()
  }, [connector])

  return (
    <button  disabled={!ready} onClick={onClick}>
      {connector.name}
    </button>
  )
}


export  const ConnectWallet = () => {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
    return <WalletOptions />
}
