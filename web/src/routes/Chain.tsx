import { 
  useEffect,
  useCallback,
  useRef
} from 'react'
import {  Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useNavigate, useLocation  } from 'react-router-dom'
import { useEstimateGas } from '@/hooks/useEstimateGas'

export const Chain = () => {
  const { chain } = useAccount()
  const navigate = useNavigate()
  const previousChainId = useRef(chain?.id)
  const location = useLocation()
  const {
    createThreadEstimate,
    createPostEstimate
  } = useEstimateGas()

  const handleChainChange = useCallback(() => {
    if (chain?.id !== previousChainId.current) {
      navigate('/chains/' + chain?.id)
      previousChainId.current = chain?.id
    }
  }, [chain?.id, navigate])


  useEffect(() => {
    handleChainChange()
  }, [handleChainChange])

  if (!chain) {
    return <>Please connect an RPC to view chain statistics</>
  }

  return (
    <>{location.pathname == `/chains/${chain.id}` ? ( 
      <div>{ chain.id == 1 && (<>
        <h3>{chain.name}</h3>
        <p>Est Cost to create Post: $ {createPostEstimate}</p>
        <p>Est Cost to create Thread: $ {createThreadEstimate}</p>
      </>)
      }
      </div>
    ) : (
      <Outlet />
    )
    }</>
  )
}
