import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useParams, Outlet } from 'react-router-dom'
import { CreateThread } from '@/components/CreateThread'
import { CreatePost } from '@/components/CreatePost'
import { useAccount } from 'wagmi'
export const Board = () => {
  const { address, chain } = useAccount()
  const { board, thread } = useParams()
  const [openMakeContent, setOpenMakeContent] = useState(false)
  console.log('address', address)
  console.log('chain', chain)
  const handleClose = () => {
    setOpenMakeContent(!openMakeContent)
  }
  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
        marginTop: '0',
        justifyContent: 'space-between'
        }}>
        <h2><Link to={`/boards/${board}`}>/{board}/</Link></h2>
        { address ? (<> { chain ? (
          <button  onClick={() => {
            setOpenMakeContent(!openMakeContent)
          }}>{thread ? "Make Post" : "Make Thread"}</button>
        ):(
          <p>Please connect to a supported chain</p>
        ) 
          }
        </>) : (
          <p>please connect a wallet to post</p>
        )
        }
      </div>
      <p>[<Link to={`/boards/${board}/catalogue`}>Catalogue</Link>]</p>
      
      {openMakeContent && (<>
        { thread ? (
          <div style={{
            width: '85.4vw',
            margin: '0 auto',
          }}>
          <CreatePost threadId={thread} replyIds={[]} handleClose={handleClose} />
          </div>
        ): (
        <CreateThread board={board} replyIds={[]} handleClose={handleClose}/>
        )
        }
        </>)
      }


      <Outlet />
      </>
  )
}
