import { useState, useEffect } from 'react';
import { Connector, useConnect, useSwitchChain  } from 'wagmi'
import { Link } from 'react-router-dom'
import { useAccount, useDisconnect, useEnsAvatar, useEnsName  } from 'wagmi'
import { truncateEthAddress } from '@/utils/address'
import { useEstimateGas } from '@/hooks/useEstimateGas'
import { formatNumberWithSubscriptZeros as fmtZero  } from '@haqq/format-number-with-subscript-zeros';
import { FaLink  } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom'

const ChainsDropDown = () => {
   const { chains, switchChain  } = useSwitchChain()
   const navigate = useNavigate()
  const [expand, setExpand] = useState(false)
  
  const handleClose = () => {
    setExpand(old => !old)
  }

  return (
    <>
      <button
        style={{
          marginLeft: '1.25vw',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        }}
        onClick={handleClose}
      >
        <p>{expand ? "▾" : "▸"}&nbsp;</p>
        <FaLink />
      </button>
      { expand && (
        <div
          style={{
            backgroundColor: '#090909',
            display: 'block',
            position: 'absolute',
            top: `${(100/ Math.PHI) + (100/ Math.PHI**3)}px`,
            zIndex: '1',
            width: `${(100*Math.PHI)+(10*Math.PHI**2)}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}>
            { chains.map((chain,i) => {
              return (
                <a
                  key={i}
                  style={{
                    padding:'0px 5px',
                    borderBottom: '1px solid #20C20E',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onClick={() => {
                    switchChain({chainId: chain.id})
                    navigate(`/`)
                  }
                  }
                >
                  {chain.name}
                </a>
              )
            })

            }
          </div>
        </div>
      )}
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
