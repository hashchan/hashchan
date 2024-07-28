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
      <div style={{marginTop: '0px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '80vw'}}>
      <h2><i>/{board}/</i></h2>
      { address ? (
        <button style={{height: '40px'}} onClick={() => setOpenMakeThread(!openMakeThread)}>Create Thread</button>
      ) : (
      <p>please connect a wallet to post</p>
      )
      }
      </div>
      <p>[<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]</p>
      {openMakeThread && <CreateThread board={board}/>}

      <Outlet />
    </>
  )
}
