import { 
  useEffect,
  useCallback,
  useRef
} from 'react'
import {  Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useNavigate, useLocation  } from 'react-router-dom'
import { useEstimateGas } from '@/hooks/useEstimateGas'
import { formatNumberWithSubscriptZeros as fmtZero  } from '@haqq/format-number-with-subscript-zeros';

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
      <div>{ (chain?.id) && (<>
        <h3>{chain.name}</h3>
        <p>{createPostEstimate && (<>Est Cost to create Post: ~${fmtZero(createPostEstimate.toFixed(20))}</>)}</p>
        <p>{createThreadEstimate && (<>Est Cost to create Thread: ~${fmtZero(createThreadEstimate.toFixed(20))}</>)}</p>
      </>)
      }
      </div>
    ) : (
      <Outlet />
    )
    }</>
  )
}
