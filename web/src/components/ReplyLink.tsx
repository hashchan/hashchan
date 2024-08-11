import { useState, forwardRef } from 'react'
import { truncateEthAddress } from '@/utils'
export const ReplyLink = forwardRef(({replyId}: {replyId: string}, ref) => {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      style={{
        color: hovered ? '#20c20E':'#DF3DF1',
        textDecoration: 'underline'
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        ref.current.scrollIntoView({behavior: 'smooth', block: 'start'})
      }}
      >
      {'@' + truncateEthAddress(replyId)}
    </span>
  )
})
