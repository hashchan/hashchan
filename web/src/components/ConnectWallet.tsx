import { useState, useEffect } from 'react';
import { Connector, useConnect  } from 'wagmi'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi'
import {truncateEthAddress} from '@/utils'
const Account = () => {
  const { address } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    <div >
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      <div>
        {address && <span style={{padding: '0px 10px'}}>{ensName ? `${ensName} (${truncateEthAddress(address)})` : truncateEthAddress(address)}</span>}
      <button onClick={() => disconnect()}>Disconnect</button>
      </div>
    </div>
  )
}

const WalletOptions = () => {
  const { connectors, connect  } = useConnect()

  return connectors.map((connector) => (
    <WalletOption
      key={connector.uid}
      connector={connector}
      onClick={() => connect({ connector })}
    />
  ))
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
    <button style={{height: '40px'}} disabled={!ready} onClick={onClick}>
      {connector.name}
    </button>
  )
}


export  const ConnectWallet = () => {
  const { isConnected } = useAccount()
  if (isConnected) return <Account />
  return <WalletOptions />
}
