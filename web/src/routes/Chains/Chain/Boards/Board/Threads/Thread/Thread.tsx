import { useState,useEffect, forwardRef, useCallback  } from 'react'
import { useParams, useLocation  } from 'react-router-dom'

import { useThread } from '@/hooks/HashChan/useThread'
import { CreatePost } from '@/components/HashChan/CreatePost'
import { truncateEthAddress } from '@/utils/address'
import { supportedExtensions } from '@/utils/content'
import { useHelia } from '@/hooks/p2p/useHelia'

import MarkdownEditor from '@uiw/react-markdown-editor';

import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { TipCreator } from '@/components/HashChan/Thread/TipCreator'
import { JannyPost } from '@/components/HashChan/Thread/JannyPost'

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
    try {
      setUri(URL.createObjectURL(blob))
    } catch (e) {
      console.log(e)
      setUri(null)
    }
  }, [fetchCID])

  useEffect(() => {
    const https = /^https?:\/\//;
    if (!https.test(imgUrl)) {
      console.log('imgUrl', imgUrl)
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
  creator, postId, imgUrl, content, timestamp, replies, handleOpenPost, janitoredBy
}:{
  creator: `0x${string}`,
  postId: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  replies: string[],
  handleOpenPost: (replyId: string) => void,
  janitoredBy: object[]
}, ref)  => {
  const location = useLocation()

  useEffect(() => {
    if (ref && location.hash.includes(`#${postId}`)) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'start'})
    }

  }, [location, postId,ref])
  console.log('janitored by', janitoredBy)
  return (<>{(janitoredBy.length > 0) ? (
    <div>
      <p>hi</p>
    </div>
  ) : (
    <div
      ref={ref}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        padding: `${1/ Math.PHI}vh 0vw`,
      }}> 
      <div
      >
        <span>{truncateEthAddress(creator)}</span>&nbsp;
        <TipCreator creator={creator} />&nbsp;
        <JannyPost postId={postId} />&nbsp;
        <PostIdSpan postId={postId} handleOpenPost={handleOpenPost} />
        <span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
        <ReplySpans replies={replies} />
      </div>
      <a style={{paddingLeft: `${1/ Math.PHI}vw`}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,33)}...</a>
      <div className="flex-wrap-center">
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

  )}
  </>)
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
            janitoredBy={post?.janitoredBy}
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
