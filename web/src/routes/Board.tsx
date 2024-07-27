import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
import { CreateThread } from '../components/CreateThread'
export const Board = () => {
  const { board } = useParams()
  const [openMakeThread, setOpenMakeThread] = useState(false)
  return (
    <>
      <h1>Board {board}</h1>
      <button onClick={() => setOpenMakeThread(!openMakeThread)}>Create Thread</button>
      {openMakeThread && <CreateThread board={board}/>}
      [<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]

      <Outlet />
    </>
  )
}
