import { useState, forwardRef  } from 'react'
import { findDOMNode } from 'react-dom'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'


const PostIdSpan = ({postId, handleOpenPost}:{postId:string, handleOpenPost: (postId:string) => void}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? '#20c20E': '#DF3DF1'
      }}
      onClick={() => handleOpenPost(postId)}
    >(id: {postId && truncateEthAddress(postId)})
    </span>
    
  )
}

const ReplySpan = ({reply}:{reply:any}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}

      onClick={() => {
        reply.ref.current.scrollIntoView({behavior: 'smooth', block: 'start'})
      }}
      style={{
      paddingLeft: '1.25vw',
      color: hovered ? '#20c20E': '#DF3DF1',
      textDecoration: 'underline'
      }}>
      {truncateEthAddress(reply.id)}
    </span>
  )
}

const ReplySpans = ({replies}: {replies: any}) => {
  if (replies && replies.length > 0) {
    return (
      <span
        style={{
          paddingLeft: '1.25vw',
          color: '#DF3DF1'
        }}
      >{ replies.map(
        (reply, i) => <ReplySpan key={i} reply={reply} />) }
      </span>
    )
  }
  return null
}

const Post = forwardRef(({
  creator, postId, imgUrl, content, timestamp, replies, handleOpenPost
}:{
  creator: string,
  postId: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  replies: string[],
  handleOpenPost: (id: string) => void,
}, ref)  => {
  const [expanded, setExpanded] = useState(false)
    return (
    <div
      ref={ref}
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      padding: '1.25vh 0vh'
      }}> 
      <div
      >
        <span
          style={{
            color: 'green',
            fontWeight: 'bold'
          }}
        >{creator && truncateEthAddress(creator)}
        </span>&nbsp;
        <PostIdSpan postId={postId} handleOpenPost={handleOpenPost} />
        <span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
        <ReplySpans replies={replies} />
      </div>
      <a style={{paddingLeft: '1.25vw'}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,33)}...</a>
      <div>
        <img 
          onClick={() => setExpanded(!expanded)}
        style={{
          float: 'left',
          justifyContent: 'center',
          objectFit: 'contain',
          paddingRight: '1.25vw',
          width: expanded ? '95vw' : '261px',
          height: expanded ? '95vh' : '28vh',
        }}
      src={imgUrl}/>
          {content && content}
      </div>
    </div>
  )
})


export const Thread = () => {
  const [makeReply, setMakeReply] = useState(null)
  const { board, thread } = useParams()

  const { posts, logErrors } = useThread(thread)

  const handleOpenPost = (threadId:string) => {
postIdsetMakeReply(threadId)
  }
  return (
    <>
      <h3 style={{wordWrap: 'break-word'}}>Thread {thread}</h3>
      {posts && posts.map((post, i) => {
        return (
          <Post
            key={i}
            creator={post?.creator}
            postId={post?.id}
            imgUrl={post?.imgUrl}
            content={post?.content}
            timestamp={post?.timestamp}
            replies={post?.replies}
            handleOpenPost={handleOpenPost}
            ref={post?.ref}
          />
        )
      })
      }{ makeReply && (
        <div
          style={{
            position: 'absolute'
          }}
        >
          <CreatePost threadId={thread} replyId={makeReply} />
        </div>
      )
      }
      {
        logErrors.length > 0  && logErrors.map((error, i) => {
          return (
            <div
              key={i}
            >
              {error}
            </div>
          )
        })
      }
    </>
  )
}
