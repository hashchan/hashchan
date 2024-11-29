import { useState, useEffect } from 'react';
import { Connector, useConnect  } from 'wagmi'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName  } from 'wagmi'
import {truncateEthAddress} from '@/utils'
import { useEstimateGas } from '@/hooks/useEstimateGas'
import { formatNumberWithSubscriptZeros as fmtZero  } from '@haqq/format-number-with-subscript-zeros';

const Account = () => {
  const { createPostEstimate } = useEstimateGas()   
  const { address, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  return (
    <div >
      {ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}
      <div>
        {(address && chain )&& <>
          <span style={{paddingRight: '1.25vw'}}>~${createPostEstimate && (<>{fmtZero(createPostEstimate.toFixed(20))}/Post</>)}</span>
          <Link to={`/chains/${chain?.id}`}>{chain?.id && chain.name}</Link>
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
