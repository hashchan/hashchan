import { Outlet, useParams } from 'react-router-dom'
import { About } from "@/components/About"
import { isBraveBrowser } from '@/utils/browserDetection'
import { BraveWarning } from '@/components/BraveWarning'
export const Home = () => {
  const isBrave = isBraveBrowser()
  console.log('isBrave', isBrave)
  const { chainId, boardId, threadId, docversion } = useParams()
  return (<>
      {isBrave && <BraveWarning />}
      {(!chainId && !boardId && !threadId && !docversion) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

