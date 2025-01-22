import { useState,  } from 'react'
import { useParams   } from 'react-router-dom'

import { useThread } from '@/hooks/HashChan/useThread'
import { CreatePost } from '@/components/HashChan/CreatePost'


import {BoardHeader} from '@/components/BoardHeader'

import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { Post } from '@/components/HashChan/Thread/Post'

export const Thread = () => {
  const [makeReply, setMakeReply] = useState([])
  const [toggleReply, setToggleReply] = useState(false)
  const {threadId, boardId } = useParams()
  const { posts, isReducedMode  } = useThread()

  const handleOpenPost = (threadId:string) => {
    setMakeReply(old => [...old, threadId])
    setToggleReply(true)
  }
  const handleClose = () => {
    setToggleReply(!toggleReply)
  }

  return (
    <>
      <BoardHeader key={`board-${boardId}-${threadId}`} />
      {toggleReply && (<CreatePost threadId={threadId} replyIds={makeReply} handleClose={handleClose} />)}
      {isReducedMode && <ReducedModeWarning />}
      <h3 style={{wordWrap: 'break-word'}}>Thread {threadId}</h3>
      {posts && posts.map((post, i) => {
        return (
          <Post
            key={i}
            creator={post?.creator}
            postId={i === 0 ? post?.threadId:post?.postId}
            imgUrl={post?.imgUrl}
            content={post?.content}
            timestamp={post?.timestamp}
            replies={post?.replies}
            handleOpenPost={handleOpenPost}
            ref={post?.ref}
            janitoredBy={post?.janitoredBy}
          />
        )
      })
      }
    </>
  )
}
