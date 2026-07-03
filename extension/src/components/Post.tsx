import { useState, forwardRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { RefObject } from 'react'

const φ = Math.PHI

const truncate = (address: string) => {
  const m = address.match(/^(0x[a-zA-Z0-9]{7})[a-zA-Z0-9]+([a-zA-Z0-9]{7})$/)
  return m ? `${m[1]}…${m[2]}` : address
}

const ReplySpan = ({ reply }: { reply: { ref: RefObject<HTMLElement | null>; id: string } }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation()
        reply.ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }}
      style={{
        color: hovered ? '#20C20E' : '#DF3DF1',
        cursor: 'pointer',
        textDecoration: 'underline',
        userSelect: 'none',
      }}
    >
      {truncate(reply.id)}
    </span>
  )
}

export const Post = forwardRef<HTMLDivElement, {
  creator: `0x${string}`
  postId: string
  imgUrl: string
  content: string
  timestamp: number
  replies: Array<{ ref: RefObject<HTMLElement | null>; id: string }>
  onReply: (postId: string) => void
}>(({ creator, postId, imgUrl, content, timestamp, replies, onReply }, ref) => {
  const [imgErr, setImgErr] = useState(false)
  const [idHovered, setIdHovered] = useState(false)
  const date = new Date(timestamp * 1000).toLocaleString()

  return (
    <div
      ref={ref}
      style={{
        borderBottom: '1px solid #1a1a1a',
        paddingBottom: `${1 / φ}em`,
        marginBottom: `${1 / φ}em`,
      }}
    >
      {/* creator + timestamp */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: `${1 / φ ** 2}em`,
        gap: `${1 / φ}em`,
      }}>
        <span style={{ color: '#19e377', fontWeight: 610 }}>
          {truncate(creator)}
        </span>
        <span style={{ color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {date}
        </span>
      </div>

      {/* post id + back-references */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.3em',
        marginBottom: `${1 / φ ** 2}em`,
      }}>
        <span
          onClick={(e) => { e.stopPropagation(); onReply(postId) }}
          onMouseEnter={() => setIdHovered(true)}
          onMouseLeave={() => setIdHovered(false)}
          style={{
            color: idHovered ? '#20C20E' : '#DF3DF1',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          (id: {truncate(postId)})
        </span>
        {replies.map((reply, i) => (
          <ReplySpan key={i} reply={reply} />
        ))}
      </div>

      {imgUrl && !imgErr && (
        <img
          src={imgUrl}
          onError={() => setImgErr(true)}
          style={{
            maxWidth: '100%',
            maxHeight: `${φ ** 2 * 50}px`,
            objectFit: 'contain',
            display: 'block',
            marginBottom: `${1 / φ ** 2}em`,
          }}
          alt=""
        />
      )}

      <div style={{
        wordBreak: 'break-word',
        lineHeight: φ,
        color: '#fff',
        marginTop: `${1 / φ ** 2}em`,
      }}>
        <ReactMarkdown
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('#')) {
                return <span style={{ color: '#DF3DF1', cursor: 'default' }}>{children}</span>
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                >
                  {children}
                </a>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
})
