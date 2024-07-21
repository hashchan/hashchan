import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
export const Board = () => {
  const { board } = useParams()
  return (
    <>
      <h1>Board {board}</h1>
      [<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]
      <Outlet />
    </>
  )
}
