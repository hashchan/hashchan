import { Outlet, useParams } from 'react-router-dom'
import { About } from "@/components/About"
export const Home = () => {
  const { thread, board, docversion } = useParams()
  return (<>
      {(!board && !thread && !docversion) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

