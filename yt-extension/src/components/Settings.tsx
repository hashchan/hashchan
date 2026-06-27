import { useConnection } from 'wagmi'
import { useBoards } from '@hashchan/hooks'
import { saveYtSettings } from '../hooks/useYtSettings'
import type { Board } from '@hashchan/hooks'

export const Settings = ({ onSave }: { onSave: () => void }) => {
  const { address, chainId } = useConnection()
  const { boards, isLoading, error } = useBoards()

  if (!address) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / Math.PHI}em`, padding: '4px' }}>
        <p style={{ fontWeight: 'bold' }}>HashChan YT</p>
        <p style={{ color: '#fff' }}>
          Connect your wallet to participate in uncensored video threads.
        </p>
      </div>
    )
  }

  const ytBoard: Board | undefined = boards.find((b: Board) => b.symbol === 'yt')

  const handleSave = () => {
    if (!ytBoard || !chainId) return
    saveYtSettings({ chainId, boardId: ytBoard.boardId })
    onSave()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / Math.PHI}em`, padding: '4px' }}>
      {isLoading ? (
        <p style={{ color: '#fff', margin: 0 }}>Loading boards...</p>
      ) : error ? (
        <p style={{ color: '#e33', margin: 0 }}>{(error as Error).message}</p>
      ) : !ytBoard ? (
        <p style={{ color: '#e33', margin: 0 }}>
          No /yt/ board on this chain — switch network in the header.
        </p>
      ) : (
        <p style={{ color: '#20C20E', margin: 0 }}>
          Found: /{ytBoard.symbol}/ — {ytBoard.name}
        </p>
      )}

      <button onClick={handleSave} disabled={!ytBoard} style={{ margin: 0 }}>
        Save
      </button>
    </div>
  )
}
