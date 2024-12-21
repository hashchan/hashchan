import { useState, useEffect, forwardRef, useCallback  } from 'react'
import { useParams, useLocation  } from 'react-router-dom'

import { useThread } from '@/hooks/HashChan/useThread'
import { CreatePost } from '@/components/HashChan/CreatePost'
import { truncateEthAddress } from '@/utils/address'

import MarkdownEditor from '@uiw/react-markdown-editor';
import { TbFlagExclamation  } from "react-icons/tb";

import {BoardHeader} from '@/components/BoardHeader'

import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { TipCreator } from '@/components/HashChan/Thread/TipCreator'
import { JannyPost } from '@/components/HashChan/Thread/JannyPost'
import { ImageDiv } from '@/components/ImageDiv'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { ReviewJanny } from '@/components/HashChan/Thread/ReviewJanny'
import {
  Table,
  TableHeader,
  TableData
} from '@/components/Table'

import { getExplorerUrl } from '@/utils/explorer'

import { useAccount } from 'wagmi'

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
  const { chain } = useAccount()
  const { board } = useBoard()
  const [viewSwitch, setViewSwitch] = useState(false)

  const handleViewSwitch = () => {
    setViewSwitch(old => !old)
  }
  useEffect(() => {
    if (janitoredBy.length > 0) {
      if (typeof janitoredBy[0] === 'undefined') return
      handleViewSwitch()
    }
  }, [janitoredBy])

  useEffect(() => {
    if (ref && location.hash.includes(`#${postId}`)) {
      ref.current.scrollIntoView({behavior: 'smooth', block: 'start'})
    }

  }, [location, postId,ref])
  return (<>{(viewSwitch) ? (
    <div style={{overflowX: 'auto'}}>
    <Table>
      <thead>
        <tr>
          <TableHeader title={"Service"}/>
          <TableHeader title={"Janitor"}/>
          <TableHeader title={"Reason"}/>
          <TableHeader title={"Actions"}/>
        </tr>
      </thead>
      <tbody>
      {janitoredBy.map((janny, i) => {
        if (!janny) return (<></>)
        return (
          <tr key={i} style={{borderBottom: '1px solid #20c20E'}}>
            <TableData content={janny?.affirmation.data.domain.name}/>
            <TableData content={truncateEthAddress(janny?.affirmation.data.message.janitor)}/>
            <TableData content={board?.rules[janny?.janny.message.reason]}/>
            <TableData content={
              <>
                <button onClick={() => handleViewSwitch()}>View Anyway</button>
                <ReviewJanny jannyTypedData={janny?.janny} />

              </>
              } />
          </tr>
        )
      })}
      </tbody>
    </Table>
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
        <a target="_blank" href={getExplorerUrl(chain,creator, 'address')}>{truncateEthAddress(creator)}</a>&nbsp;
        <TipCreator creator={creator} />&nbsp;
        <JannyPost postId={postId} />&nbsp;
        {janitoredBy.length > 0 && (<>
          <span
            onClick={() => handleViewSwitch()}
            style={{
              paddingLeft: `${1/ Math.PHI}vw`,
              color: 'white'
            }}
          >
            <TbFlagExclamation />
          </span>&nbsp;
        </>)}
        <PostIdSpan postId={postId} handleOpenPost={handleOpenPost} />
        <span>&nbsp;{timestamp && new Date(timestamp * 1000).toLocaleString()}</span>
        <ReplySpans replies={replies} />
      </div>
      <a style={{paddingLeft: `${1/ Math.PHI}vw`}} target="_blank" href={imgUrl}>{ imgUrl && imgUrl.substring(0,34)}...</a>
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
  const {threadId, boardId } = useParams()
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
