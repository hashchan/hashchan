import { Outlet, useParams } from 'react-router-dom'
import { About } from "@/components/About"
import { BraveWarning } from '@/components/BraveWarning'
import { ChromeWarning } from '@/components/ChromeWarning'
import { useCheckBrave } from '@/hooks/useCheckBrave'
import { useCheckRpc } from '@/hooks/useCheckRpc'
export const Home = () => {
  const { isBrave } = useCheckBrave()
  const { hasNewFilter } = useCheckRpc()
  console.log('isBrave', isBrave)
  const { chainId, boardId, threadId, docversion } = useParams()
  return (<>
      {(isBrave && !hasNewFilter) && <BraveWarning />}
      {(!isBrave && !hasNewFilter) && <ChromeWarning />}
      {(!chainId && !boardId && !threadId && !docversion) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

