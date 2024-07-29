import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
import { CreateThread } from '@/components/CreateThread'
import { CreatePost } from '@/components/CreatePost'
import { useAccount } from 'wagmi'
export const Board = () => {
  const { address } = useAccount()
  const { board, thread } = useParams()
  const [openMakeContent, setOpenMakeContent] = useState(false)

  return (
    <>
      <div style={{marginTop: '0px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '80vw'}}>
        <h2><Link to={`/boards/${board}`}>/{board}/</Link></h2>
      { address ? (
        <button style={{height: '40px'}} onClick={() => {
            setOpenMakeContent(!openMakeContent)
        }}>{thread ? "Make Post" : "Make Thread"}</button>
      ) : (
      <p>please connect a wallet to post</p>
      )
      }
      </div>
      <p>[<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]</p>
      {openMakeContent && (<>
        { thread ? (
          <CreatePost threadId={thread} />
        ): (
          <CreateThread board={board}/>
          )
        }
        </>)
      }


      <Outlet />
    </>
  )
}
