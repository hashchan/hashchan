import { useState, forwardRef  } from 'react'
import { useParams  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import {truncateEthAddress} from '@/utils'
import { useTip } from '@/hooks/useTip'
import { useForm  } from "react-hook-form";

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

const TipCreator = ({creator}: {creator: `0x${string}`}) => {
  const { createTip } = useTip()
  const [hovered, setHovered] = useState(false)
  const { register, handleSubmit, formState: { errors  }  } = useForm();
  const [rpcError, setRpcError] = useState(null)
  const onSubmit = async (data) => {
    console.log(data)
    const response = await createTip(
      creator,
      data.amount
    )
    if (response.hash) {
      console.log('response', response)
    } else {
      console.log('error', response.error.message)
      setRpcError(response.error.message)
    }
  }

  return (
    <span
      onMouseEnter={() => setHovered(true)}
      style={{
        color: hovered ? '#20c20E': 'green',
      }}
    >{creator && truncateEthAddress(creator)}
      {hovered &&
        <form
          onMouseLeave={() => setHovered(false)}
          style={{
          backgroundColor:"#090909",
          position: 'absolute',
          padding: '1.25vh 1.25vw',
          }}
          onSubmit={handleSubmit(onSubmit)}
        ><label htmlFor="amount">Tip: </label>
          <input style={{width:'5vw'}} defaultValue="0.01" {...register("amount", { required: true })} />
          {errors.amount && <span>This field is required</span>}
          <input type="submit" />
        </form>
      }
      {rpcError && <div 
        onMouseLeave={() => setRpcError(null)}
        style={{ backgroundColor: 'red', position: 'absolute' }}
      >{rpcError}</div>}
    </span>
  )
}
const Post = forwardRef(({
  creator, postId, imgUrl, content, timestamp, replies, handleOpenPost
}:{
  creator: `0x${string}`,
  postId: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  replies: string[],
  handleOpenPost: (replyId: string) => void,
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
        <TipCreator creator={creator} />&nbsp;
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
  const [makeReply, setMakeReply] = useState([])
  const [toggleReply, setToggleReply] = useState(false)
  const { board, thread } = useParams()

  const { posts, logErrors } = useThread(thread)

  const handleOpenPost = (threadId:string) => {
    setMakeReply(old => [...old, threadId])
    setToggleReply(true)
    console.log('hi')
  }
  const handleClose = () => {
    setToggleReply(!toggleReply)
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
      }{ toggleReply && (
        <div style={{
          position: 'fixed',
          inset: 'unset',
          top: '50vh',
          left: '7.3vw',
          }}>
          <CreatePost threadId={thread} replyIds={makeReply} handleClose={handleClose} />
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
