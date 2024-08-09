import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread, ReplyLink } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'

/*
const ReplyLink = ({replyId}: {replyId: string}) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? '#20c20E':'#DF3DF1',
      textDecoration: 'underline'}
      }>
      {replyId}
    </span>
  )
}


const parseContent = (content: string) => {
  return reactStringReplace(
    content,
    /@(0x.{64})/gm,
    (match) => {
      match = match.replace(/@+/g,'')
      match = "@" + truncateEthAddress(match)
      return <ReplyLink replyId={match} />
    }
  )
    
}
 */

const PostIdSpan = ({id, handleOpenPost}:{id:string, handleOpenPost: (id:string) => void}) => {
  const [hovered, setHovered] = useState(false)

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? '#20c20E': '#DF3DF1'
      }}
      onClick={() => handleOpenPost(id)}
    >(id: {id && truncateEthAddress(id)})
    </span>
    
  )
}

const ReplySpan = ({replies}: {replies: string[]}) => {
  if (replies && replies.length > 0) {
    return (
      <span
        style={{
          paddingLeft: '1.25vw',
          color: '#DF3DF1'
        }}
      >{ replies.map((reply, i) => <span key={i}>{truncateEthAddress(reply)} </span>) }
      </span>
    )
  }
  return null
}

const Post = ({
  creator, id, imgUrl, content, timestamp, replies, handleOpenPost
}:{
  creator: string,
  id: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  replies: string[],
  handleOpenPost: (id: string) => void
})  => {
  const [expanded, setExpanded] = useState(false)
    return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      padding: '1.25vh 0vh'
      }}> 
      <div
        style={{
        }}
      >
        <span
          style={{
            color: 'green',
            fontWeight: 'bold'
          }}
        >{creator && truncateEthAddress(creator)}
        </span>&nbsp;
        <PostIdSpan id={id} handleOpenPost={handleOpenPost} />
        <span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
        <ReplySpan replies={replies} />
      </div>
      <a style={{paddingLeft: '1.25vw'}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,33)}...</a>
      <div
        style={{
        }}>
        <div style={{
          }}>
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
    </div>
  )
}


export const Thread = () => {
  const [makeReply, setMakeReply] = useState(null)
  const { board, thread } = useParams()

  const { op, posts, logErrors } = useThread(thread)

  const handleOpenPost = (threadId:string) => {
    setMakeReply(threadId)
  }
  return (
    <>
      <h3 style={{wordWrap: 'break-word'}}>Thread {thread}</h3>
      {posts && posts.map((post, i) => {
        return (
          <Post
            key={i}
            creator={post?.creator}
            id={post?.id}
            imgUrl={post?.imgUrl}
            content={post?.content}
            timestamp={post?.timestamp}
            replies={post?.replies}
            handleOpenPost={handleOpenPost}
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
