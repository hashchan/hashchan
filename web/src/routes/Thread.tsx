import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'
const Post = ({
  creator, id, imgUrl, content, timestamp
}:{
  creator: string,
  id: string,
  imgUrl: string,
  content: string,
  timestamp: number
})  => {
  const [expanded, setExpanded] = useState(false)
  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '23px 23px 1fr',
      gridTemplateColumns: '161px 0.854fr',
      }}> 
      <div
        style={{
          gridColumn: '1/4',
          gridRow: '1',
        }}
      ><span style={{
        color: 'green',
        fontWeight: 'bold'
          }}>{creator && truncateEthAddress(creator)}</span>&nbsp;<span>(id: {id && truncateEthAddress(id)})</span><span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
      </div>
      <div
        style={{
          gridColumn: '1/3',
          gridRow: '2',
        }}
      ><a style={{width: '100%'}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,33)}...</a>
      </div>
      <div
        style={{
          gridColumn: '1/-1',
          gridRow: '3'
        }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          }}>
        <img 
          onClick={() => setExpanded(!expanded)}
        style={{
          maxWidth: expanded ? '95vw' : '161px',
          maxHeight: expanded ? '95vh' : '28vh',
        }}
      src={imgUrl}/>
          <p style={{paddingLeft: '15px'}}>{content}</p>
        </div>
      </div>
    </div>
  )
}


export const Thread = () => {
  const [openMakePost, setOpenMakePost] = useState(false)
  const { board, thread } = useParams()

  const { op, posts, fetchPosts } = useThread(thread)


  return (
    <>
      <h3>Thread {thread}</h3>
      <Post creator={op?.creator} id={op?.id} imgUrl={op?.imgUrl} content={op?.content} timestamp={op?.timestamp}/>
      {posts && posts.map((post, i) => {
        return (<Post key={i} creator={post?.creator} id={post?.id} imgUrl={post?.imgUrl} content={post?.content} timestamp={post?.timestamp} />)
      })
      }
    </>
  )
}
