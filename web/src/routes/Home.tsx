import { Outlet, useParams } from 'react-router-dom'
import { About } from "@/components/About"
export const Home = () => {
  const { chainId, boardId, threadId, docversion } = useParams()
  return (<>
      {(!chainId && !boardId && !threadId && !docversion) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

