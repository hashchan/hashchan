import { 
  useEffect,
  useCallback,
  useRef
} from 'react'
import {  Outlet } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useNavigate  } from 'react-router-dom'
export const Chain = () => {
  const { chain } = useAccount()
  const navigate = useNavigate()
  const previousChainId = useRef(chain?.id)


  const handleChainChange = useCallback(() => {
    if (chain?.id !== previousChainId.current) {
      navigate('/chains/' + chain?.id)
      previousChainId.current = chain?.id
    }
  }, [chain?.id, navigate])


  useEffect(() => {
      handleChainChange()
  }, [handleChainChange])

  return (
    <>
      <Outlet />
    </>
  )
}
