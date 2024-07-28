import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
const Post = ({
  creator, id, imgUrl, content
}:{
  creator: string,
  id: string,
  imgUrl: string,
  content: string
})  => {

  return (
    <div>
      <p>creator: {creator}</p>
      <p>id: {id}</p>
      <p>imgUrl: {imgUrl}</p>
      <p>content: {content}</p>
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
      { openMakePost ? 
        (<CreatePost threadId={thread} />) :
        (<button onClick={() => setOpenMakePost(!openMakePost)}>Make Post</button>)
      }
    </>
  )
}
