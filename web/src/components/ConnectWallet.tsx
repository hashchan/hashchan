import { useState, useEffect } from 'react';
import { Connector, useConnect, useSwitchChain  } from 'wagmi'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName  } from 'wagmi'
import { truncateEthAddress } from '@/utils/address'
import { useEstimateGas } from '@/hooks/useEstimateGas'
import { formatNumberWithSubscriptZeros as fmtZero  } from '@haqq/format-number-with-subscript-zeros';
import { FaLink  } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom'
import { DropDown } from '@/components/DropDown'

const ChainDropDownItem = ({
  chainId,
  chainName,
  switchChain
}:{
  chainId: number,
  chainName: string,
  switchChain: ({chainId}) => void
}) => {

  const navigate = useNavigate()
  const [hover, setHover] = useState(false)

  const handleMouseEnter = () => {
    setHover(true)
  }

  const handleMouseLeave = () => {
    setHover(false)
  }
  return (
    <a
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        margin: '5px 8px',
        backgroundColor: hover ? '#222222' : '#090909',
        padding:'5px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        whiteSpace: 'nowrap',
      }}
      onClick={() => {
        switchChain({chainId})
        navigate(`/`)
      }
      }
    >
      {chainName}
    </a>

  )
}


const ChainsDropDown = () => {
  const { chains, switchChain  } = useSwitchChain()
  return (
    <>
      <DropDown name={<FaLink />}>
        { chains.map((chain,i) => {
          return <ChainDropDownItem key={i} chainId={chain.id} chainName={chain.name} switchChain={switchChain} />
        })
        }
      </DropDown>
    </>
  )
}

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
        <ChainsDropDown />
        {chain ? (
          <Link to={`/chains/${chain?.id}`}>{chain?.id && chain.name}</Link>
        ): (
        <span style={{paddingRight: '1.25vw'}}>Unsupported chain</span>
        )}
        {(address && chain )&& <>
          <span style={{paddingLeft: '1.25vw', paddingRight: '1.25vw'}}>~${createPostEstimate && (<>{fmtZero(createPostEstimate.toFixed(20))}/Post</>)}</span>
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
