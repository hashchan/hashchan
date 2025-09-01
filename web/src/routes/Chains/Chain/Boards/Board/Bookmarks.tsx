import { Fragment, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { BoardHeader } from '@/components/BoardHeader'
import { ReducedModeWarning } from '@/components/ReducedModeWarning'
import { ChainSwitchNotification } from '@/components/ChainSwitchNotification'
import { useBookmarkedPosts } from '@/hooks/HashChan/useBookmarkedPosts'
import { ImageDiv } from '@/components/ImageDiv'
import { truncateEthAddress } from '@/utils/address'
import { getExplorerUrl } from '@/utils/explorer'

const CreatorLink = ({ creator, chain }: { creator: string, chain: any }) => {
  const [hovered, setHovered] = useState(false)
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <a 
        target="_blank" 
        href={getExplorerUrl(chain, creator, 'address')}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          color: hovered ? '#20c20E' : '#DF3DF1',
          textDecoration: 'none'
        }}
      >
        {truncateEthAddress(creator)}
      </a>
    </div>
  )
}

export const Bookmarks = () => {
  const { address, chain } = useAccount()
  const { boardId, chainId } = useParams()
  const { 
    bookmarkedItems = [], 
    isLoading, 
    error
  } = useBookmarkedPosts()

  return (
    <Fragment>
      <ChainSwitchNotification />
      <BoardHeader key={`board-${boardId}-bookmarks`} />

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ display: "inline" }}>Bookmarks</h3>
      </div>

      {isLoading && <p>Loading bookmarks...</p>}
      {error && <p>Error loading bookmarks: {error.message}</p>}
      
      {bookmarkedItems.length === 0 && !isLoading && (
        <p>No bookmarked items found.</p>
      )}

      {bookmarkedItems.filter(item => item.type === 'thread').map((item, index) => (
        <div key={`thread-${item.threadId}`} style={{ 
          marginBottom: '21px', 
          padding: '10px', 
          border: '1px solid #333',
          borderRadius: '5px',
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}>
          {item.imgUrl && (
            <div style={{ marginBottom: '8px' }}>
              <ImageDiv imgUrl={item.imgUrl} />
            </div>
          )}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '0.382fr 1fr',
            gridTemplateRows: 'repeat(4, 1fr)',
            gap: '8px',
          }}>
            <div
              style={{
                gridRow: '1',
                gridColumn: '1',
                textAlign: 'right'
              }}
            >
              Thread: 
            </div>
            <div
              style={{
                gridRow: '1',
                gridColumn: '2'
              }}
            >
              <Link to={`/chains/${chainId}/boards/${boardId}/threads/${item.threadId}`}>
                {truncateEthAddress(item.threadId)}
              </Link>
            </div>
            <div
              style={{
                gridRow: '2',
                gridColumn: '1',
                textAlign: 'right'
              }}
            >
              Creator: 
            </div>
            <div
              style={{
                gridRow: '2',
                gridColumn: '2'
              }}
            >
              <CreatorLink creator={item.creator} chain={chain!} />
            </div>
            <div
              style={{
                gridRow: '3',
                gridColumn: '1',
                textAlign: 'right'
              }}
            >
              Content: 
            </div>
            <div
              style={{
                gridRow: '3',
                gridColumn: '2'
              }}
            >
              {item.content.substring(0, 618)}...
            </div>
            <div
              style={{
                gridRow: '4',
                gridColumn: '1',
                textAlign: 'right'
              }}
            >
              Timestamp: 
            </div>
            <div
              style={{
                gridRow: '4',
                gridColumn: '2'
              }}
            >
              {new Date(item.timestamp * 1000).toLocaleString()}
            </div>

          </div>
        </div>
      ))}
    </Fragment>
  )
}