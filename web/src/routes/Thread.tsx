import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'
const Post = ({
  creator, id, imgUrl, content
}:{
  creator: string,
  id: string,
  imgUrl: string,
  content: string
})  => {

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: '40px 1fr',
      gridTemplateColumns: '0.238fr 0.854fr',
      }}> 
      <div
        style={{
          gridColumn: '1/4',
          gridRow: '1',
        }}
      ><span style={{
        color: 'green',
        fontWeight: 'bold'
        }}>{creator && truncateEthAddress(creator)}</span>&nbsp;<span>(id: {id && truncateEthAddress(id)})</span>
      </div>
      <div
        style={{
          gridColumn: '1',
          gridRow: '3',
        }}
      ><img src={imgUrl}/></div>
      <div
        style={{
          gridColumn: '2/3',
          gridRow: '3',
        }}
      ><p>{content}</p></div>
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
      <Post creator={op?.creator} id={op?.id} imgUrl={op?.imgUrl} content={op?.content} />
      {posts && posts.map((post, i) => {
        return (<Post key={i} creator={post?.creator} id={post?.id} imgUrl={post?.imgUrl} content={post?.content} />)
      })
      }
    </>
  )
}
