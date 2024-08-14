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
  return (
    <>
      <div style={{
        marginTop: '0',
        display: 'flex',
        alignItems: 'center',
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
          <CreatePost threadId={thread} replyId={null} />
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
