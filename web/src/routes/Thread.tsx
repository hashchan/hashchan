import { useState,useEffect, forwardRef, useCallback  } from 'react'
import { useParams, useLocation  } from 'react-router-dom'

import { useThread } from '@/hooks/useThread'
import { CreatePost } from '@/components/CreatePost'
import { truncateEthAddress } from '@/utils/address'
import { supportedExtensions } from '@/utils/content'
import { useTip } from '@/hooks/useTip'
import { useHelia } from '@/hooks/useHelia'

import { useForm  } from "react-hook-form";

import MarkdownEditor from '@uiw/react-markdown-editor';
import { ReducedModeWarning } from '@/components/ReducedModeWarning'

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
        paddingLeft: `${1/ Math.PHI}vw`,
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
          paddingLeft: `${1/ Math.PHI}vw`,
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
            padding: `${1/ Math.PHI}vh ${1/ Math.PHI}vw`,
          }}
          onSubmit={handleSubmit(onSubmit)}
        ><label htmlFor="amount">Tip: </label>
          <input style={{width:`${100/ Math.PHI}px`}} defaultValue={(Math.PHI)/100} {...register("amount", { required: true })} />
          {errors.amount && <span>This field is required</span>}
          <button type="submit">Tip</button>
        </form>
      }
      {rpcError && <div 
        onMouseLeave={() => setRpcError(null)}
        style={{ backgroundColor: 'red', position: 'absolute' }}
      >{rpcError}</div>}
    </span>
  )
}

const ImageDiv = ({imgUrl}: {imgUrl: string}) => {
  //imgUrl = 'bafkreiab6xxyrrnitmrukgeh5kwvnyhidhxsdmuloyeft7omycpk2vauwu'
  const [uri, setUri] = useState(null)
  const { fetchCID, logErrors:heliaLogErrors } = useHelia()
  const [protocol, setProtocol] = useState(null)
  const [expanded, setExpanded] = useState(false)
  const [isVideo, setIsVideo] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [imgError, setImgError] = useState(false)

  const handleImageError = () => {
    setImgError(true)
    setIsVideo(true)
  }
  const handleVideoError = () => {
    setIsVideo(false);
    setVideoError(true);
  };

  const handleFetchCID = useCallback(async (cid) => {
    const {blob, type}  = await fetchCID(cid)
    console.log('blob', blob)
    setUri(URL.createObjectURL(blob))
  }, [fetchCID])

  useEffect(() => {
    const https = /^https?:\/\//;
      if (!https.test(imgUrl)) {
      handleFetchCID(imgUrl)
    } else {
      setUri(imgUrl)
    }
  }, [handleFetchCID, imgUrl])

  if (videoError && imgError) {
    return (<></>)
  }

  if (isVideo || imgError) {
    return (
      <video
        src={uri}
        style={{
          float: 'left',
          justifyContent: 'center',
          objectFit: 'contain',
          paddingRight: `${1/ Math.PHI}vw`,
          minHeight: `${100*(Math.PHI - 1)}px`,
          maxWidth: `${100*(Math.PHI + 1)}px`,
          maxHeight: `${1000/(Math.PHI**3)}px`,
        }}
        preload="metadata"
        controls
        playsInline
        onError={handleVideoError}
      />
    )
  }
  return (
    <img 
      onClick={() => setExpanded(!expanded)}
      style={{
        float: 'left',
        justifyContent: 'center',
        objectFit: 'contain',
        paddingRight: `${1/ Math.PHI}vw`,
        minHeight: `${100*(Math.PHI - 1)}px`,
        maxWidth: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vw` : `${100*(Math.PHI + 1)}px`,
        maxHeight: expanded ? `${(100/(Math.PHI))+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vh` : `${1000/(Math.PHI**3)}px`,
      }}
      src={uri}
      onError={handleImageError}
    />
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
  const location = useLocation()

  useEffect(() => {
    if (ref && location.hash.includes(`#${postId}`)) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'start'})
    }

  }, [location, postId,ref])
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        padding: `${1/ Math.PHI}vh 0vw`,
      }}> 
      <div
      >
        <TipCreator creator={creator} />&nbsp;
        <PostIdSpan postId={postId} handleOpenPost={handleOpenPost} />
        <span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
        <ReplySpans replies={replies} />
      </div>
      <a style={{paddingLeft: `${1/ Math.PHI}vw`}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,33)}...</a>
      <div className="flex-wrap-center" style={{
        }}>
        <ImageDiv imgUrl={imgUrl} />
        <MarkdownEditor.Markdown
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: `${(100/ Math.PHI)+(100/ (Math.PHI**4))}vw`
          }}
          source={content}
        /> 
      </div>
    </div>
  )
})


export const Thread = () => {
  const [makeReply, setMakeReply] = useState([])
  const [toggleReply, setToggleReply] = useState(false)
  const {threadId } = useParams()

  const { posts, isReducedMode, logErrors } = useThread()

  const handleOpenPost = (threadId:string) => {
    setMakeReply(old => [...old, threadId])
    setToggleReply(true)
  }
  const handleClose = () => {
    setToggleReply(!toggleReply)
  }

  return (
    <>
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
          />
        )
      })
      }      {
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
