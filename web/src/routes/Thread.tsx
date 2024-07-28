import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'

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
      <p>{creator}</p>
      <p>{id}</p>
      <p>{imgUrl}</p>
      <p>{content}</p>
    </div>
  )
}


export const Thread = () => {
  const { board, thread } = useParams()

  const { op, posts, fetchPosts } = useThread(thread)


  return (
    <>
      <h3>Thread {thread}</h3>
      <Post creator={op?.creator} id={op?.id} imgUrl={op?.imgUrl} content={op?.content} />
      {posts && posts.map((post, i) => {
        return <p key={i}>{post}</p>
      })

      }

    </>
  )
}
