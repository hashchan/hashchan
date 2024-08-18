import { Outlet, useParams } from 'react-router-dom'
import { About } from "@/components/About"
export const Root = () => {
  const { thread, board } = useParams()
  return (<>
      {(!board && !thread) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

