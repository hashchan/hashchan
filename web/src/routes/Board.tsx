import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
import { CreateThread } from '../components/CreateThread'
import { useAccount } from 'wagmi'
export const Board = () => {
  const { address } = useAccount()
  const { board } = useParams()
  const [openMakeThread, setOpenMakeThread] = useState(false)
  return (
    <>
      <h1>Board {board}</h1>
      [<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]
      { address ? (
        <button onClick={() => setOpenMakeThread(!openMakeThread)}>Create Thread</button>
      ) : (
      <p>please connect a wallet to post</p>
      )
      }
      {openMakeThread && <CreateThread board={board}/>}

      <Outlet />
    </>
  )
}
