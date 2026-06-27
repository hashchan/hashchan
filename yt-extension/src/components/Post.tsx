import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

const φ = Math.PHI

const truncate = (address: string) => {
  const m = address.match(/^(0x[a-zA-Z0-9]{7})[a-zA-Z0-9]+([a-zA-Z0-9]{7})$/)
  return m ? `${m[1]}…${m[2]}` : address
}

export const Post = ({
  creator,
  postId,
  imgUrl,
  content,
  timestamp,
  onReply,
}: {
  creator: `0x${string}`
  postId: string
  imgUrl: string
  content: string
  timestamp: number
  onReply: (postId: string) => void
}) => {
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const date = new Date(timestamp * 1000).toLocaleString()

  return (
    <div style={{
      borderBottom: '1px solid #1a1a1a',
      paddingBottom: `${1 / φ}em`,
      marginBottom: `${1 / φ}em`,
    }}>
      {/* creator + timestamp */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: `${1 / φ ** 2}em`,
        gap: `${1 / φ}em`,
      }}>
        <span style={{ color: '#19e377', fontWeight: 685 }}>
          {truncate(creator)}
        </span>
        <span style={{ color: '#fff', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {date}
        </span>
      </div>

      {/* clickable post id */}
      <div style={{ marginBottom: `${1 / φ ** 2}em` }}>
        <span
          onClick={() => onReply(postId)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          style={{
            color: hovered ? '#20C20E' : '#DF3DF1',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          (id: {truncate(postId)})
        </span>
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
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </div>
  )
}
