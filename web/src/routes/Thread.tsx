import { useState, useEffect } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'

const parseContent = (content: string) => {
  const parsed = content.replaceAll(/@(0x.{64})/gm, (a) => {
    a = a.replace(/@+/g,'')
    console.log('trying to replace all')
    console.log('a', a)
    return "@" + truncateEthAddress(a)
  })
  return (<p style={{textAlign: 'justify', padding: '2.5vh 2.5vw', wordBreak: 'break-word'}}>{parsed}</p>)
}


const Post = ({
  creator, id, imgUrl, content, timestamp, handleOpenPost
}:{
  creator: string,
  id: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  handleOpenPost: (id: string) => void
})  => {
  const [expanded, setExpanded] = useState(false)
    return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap'

      }}> 
      <div
        style={{
        }}
      ><span style={{
        color: 'green',
        fontWeight: 'bold'
          }}>{creator && truncateEthAddress(creator)}</span>&nbsp;<span
            onClick={() => handleOpenPost(id)}>(id: {id && truncateEthAddress(id)})</span><span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
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
          {content && parseContent(content)}
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
      <Post
        creator={op?.creator}
        id={op?.id}
        imgUrl={op?.imgUrl}
        content={op?.content}
        timestamp={op?.timestamp}
        handleOpenPost={handleOpenPost}
      />
      {posts && posts.map((post, i) => {
        return (
          <Post
            key={i}
            creator={post?.creator}
            id={post?.id}
            imgUrl={post?.imgUrl}
            content={post?.content}
            timestamp={post?.timestamp}
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
