import { useState, forwardRef, useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { useBoard } from '@/hooks/HashChan/useBoard'
import { getExplorerUrl } from '@/utils/explorer'
import { truncateEthAddress } from '@/utils/address'
import { TbFlagExclamation } from "react-icons/tb";
import MarkdownEditor from '@uiw/react-markdown-editor';
import { defaultUrlTransform } from 'react-markdown';

import {
  Table,
  TableHeader,
  TableData
} from '@/components/Table'


import { TipCreator } from '@/components/HashChan/Thread/TipCreator'
import { JannyPost } from '@/components/HashChan/Thread/JannyPost'
import { ImageDiv } from '@/components/ImageDiv'
import { ReviewJanny } from '@/components/HashChan/Thread/ReviewJanny'
import { Bookmarker } from '@/components/HashChan/Thread/Bookmarker'


const PostIdSpan = ({ postId, handleOpenPost }: { postId: string, handleOpenPost: (postId: string) => void }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        color: hovered ? '#20c20E' : '#DF3DF1'
      }}
      onClick={() => handleOpenPost(postId)}
    >(id: {postId && truncateEthAddress(postId)})
    </span>

  )
}

const ReplySpan = ({ reply }: { reply: any }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}

      onClick={() => {
        reply.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      style={{
        paddingLeft: `${1 / Math.PHI}vw`,
        color: hovered ? '#20c20E' : '#DF3DF1',
        textDecoration: 'underline'
      }}>
      {truncateEthAddress(reply.id)}
    </span>
  )
}

const ReplySpans = ({ replies }: { replies: any }) => {
  if (replies && replies.length > 0) {
    return (
      <span
        style={{
          paddingLeft: `${1 / Math.PHI}vw`,
          color: '#DF3DF1'
        }}
      >{replies.map(
        (reply, i) => <ReplySpan key={i} reply={reply} />)}
      </span>
    )
  }
  return null
}


export const Post = forwardRef(({
  creator,
  postId,
  imgUrl,
  content,
  timestamp,
  replies,
  bookmarked,
  handleOpenPost,
  janitoredBy,
  bookmark
}: {
  creator: `0x${string}`,
  postId: string,
  imgUrl: string,
  content: string,
  timestamp: number,
  replies: string[],
  bookmarked: number,
  handleOpenPost: (replyId: string) => void,
  janitoredBy: object[],
  bookmark: (chainId: string, boardId: string, threadId: string, postId: string) => void
}, ref) => {
  const location = useLocation()
  const { chainId, boardId, threadId } = useParams()
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
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

  }, [location, postId, ref])
  return (<>{(viewSwitch) ? (
    <div style={{ overflowX: 'auto' }}>
      <Table>
        <thead>
          <tr>
            <TableHeader title={"Service"} />
            <TableHeader title={"Janitor"} />
            <TableHeader title={"Reason"} />
            <TableHeader title={"Actions"} />
          </tr>
        </thead>
        <tbody>
          {janitoredBy.map((janny, i) => {
            if (!janny) return (<></>)
            return (
              <tr key={i} style={{ borderBottom: '1px solid #20c20E' }}>
                <TableData content={janny?.affirmation.data.domain.name} />
                <TableData content={truncateEthAddress(janny?.affirmation.data.message.janitor)} />
                <TableData content={board?.rules[janny?.janny.message.reason]} />
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
      }}>&nbsp;
      <div
      >
        <a target="_blank" href={getExplorerUrl(chain, creator, 'address')}>{truncateEthAddress(creator)}</a>&nbsp;
        {postId === threadId && (
          <>
          <Bookmarker
            bookmarked={Boolean(bookmarked)}
            bookmark={() => bookmark(chainId!, boardId!, threadId!, postId)}
          />&nbsp;
          </>
        )
}
        <TipCreator creator={creator} />&nbsp;
        <JannyPost postId={postId} />&nbsp;
        {janitoredBy.length > 0 && (<>
          <span
            onClick={() => handleViewSwitch()}
            style={{
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
      <a style={{ paddingLeft: `${1 / Math.PHI}vw` }} target="_blank" href={imgUrl}>{imgUrl && imgUrl.substring(0, 34)}...</a>
      <div className="flex-wrap-center">
        <ImageDiv imgUrl={imgUrl} />
        <MarkdownEditor.Markdown
          style={{
            width: `${(100 / Math.PHI) + (100 / (Math.PHI ** 4))}vw`
          }}
          source={content}
          // @uiw/react-markdown-preview overrides react-markdown's built-in
          // urlTransform with an identity function, so `[x](javascript:...)`
          // in post content would otherwise render as a live, clickable
          // javascript: link. Pass the real sanitizer back in.
          urlTransform={defaultUrlTransform}
        />
      </div>
    </div>

  )}
  </>)
})
