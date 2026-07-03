import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useConnection } from 'wagmi'
import { useBoards, useSettings } from '@hashchan/hooks'
import { saveSiteSettings } from '../hooks/useSiteSettings'
import type { Board } from '@hashchan/hooks'

const φ = Math.PHI

const SITE_BOARDS = [
  { siteId: 'youtube'       as const, symbol: 'yt',   label: '/yt/ — YouTube' },
  { siteId: 'wikipedia'     as const, symbol: 'wiki', label: '/wiki/ — Wikipedia' },
  { siteId: 'rottentomatoes'as const, symbol: 'rt',   label: '/rt/ — Rotten Tomatoes' },
]

export const Settings = ({ onSave }: { onSave: () => void }) => {
  const { address, chainId } = useConnection()
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards()
  const { settings, updateSettings } = useSettings()

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      indexingStrategy: 'fullNode' as 'fullNode' | 'reverseChunked' | 'bulkScrape',
      blockRangeLimit: 10000,
    },
  })

  const indexingStrategy = watch('indexingStrategy')

  useEffect(() => {
    if (settings) {
      reset({
        indexingStrategy: settings.indexingStrategy,
        blockRangeLimit: settings.blockRangeLimit,
      })
    }
  }, [settings, reset])

  if (!address) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}>
        <p style={{ fontWeight: 'bold' }}>HashChan</p>
        <p style={{ color: '#fff' }}>Connect your wallet to participate in decentralized page threads.</p>
      </div>
    )
  }

  const foundBoards = SITE_BOARDS.map(({ siteId, symbol, label }) => ({
    siteId,
    symbol,
    label,
    board: (boards as Board[]).find((b: Board) => b.symbol === symbol),
  }))

  const anyBoardFound = foundBoards.some(({ board }) => !!board)

  const onSubmit = async (data: any) => {
    if (!chainId) return
    for (const { siteId, board } of foundBoards) {
      if (board) saveSiteSettings(siteId, { chainId, boardId: board.boardId })
    }
    await updateSettings({
      indexingStrategy: data.indexingStrategy,
      blockRangeLimit: Number(data.blockRangeLimit),
    })
    onSave()
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}
    >
      {/* per-site board status */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
        <label style={{ display: 'block' }}>Boards on this chain</label>
        {boardsLoading ? (
          <p style={{ color: '#fff', margin: 0 }}>Loading boards...</p>
        ) : boardsError ? (
          <p style={{ color: '#e33', margin: 0 }}>{(boardsError as Error).message}</p>
        ) : (
          foundBoards.map(({ symbol, label, board }) => (
            <div key={symbol} style={{ display: 'flex', alignItems: 'center', gap: `${1 / φ ** 2}em` }}>
              <span style={{ color: board ? '#20C20E' : '#555', fontFamily: 'monospace', fontSize: `${1 / φ}em`, minWidth: '3em' }}>
                /{symbol}/
              </span>
              <span style={{ color: board ? '#fff' : '#555', fontSize: `${1 / φ}em` }}>
                {board ? `${board.name} ✓` : `${label.split('—')[1].trim()} — not found`}
              </span>
            </div>
          ))
        )}
      </div>

      {/* indexing strategy */}
      <div>
        <label style={{ display: 'block', marginBottom: `${1 / φ ** 2}em` }}>Index Strategy</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
          {([
            ['fullNode',      'Full Node',      'Good for full powered RPCs. Fetches all history from the start of the contract.'],
            ['reverseChunked','Reverse Chunked','Good for limited RPCs. Fetches in small batches backwards from the current block.'],
            ['bulkScrape',    'Bulk Scrape',    'Good for strange RPCs. Fetches everything unfiltered from genesis — may be slow.'],
          ] as const).map(([value, label, desc]) => (
            <label key={value} style={{ display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: `${1 / φ ** 2}em` }}>
                <input type="radio" value={value} {...register('indexingStrategy')} />
                <span>{label}</span>
              </div>
              <p style={{ margin: 0, fontSize: `${1 / φ}em`, color: '#aaa', paddingLeft: '20px' }}>{desc}</p>
            </label>
          ))}
        </div>
      </div>

      {indexingStrategy === 'reverseChunked' && (
        <div>
          <label style={{ display: 'block', marginBottom: '4px' }}>Block Range Limit</label>
          <input
            type="number"
            min={100}
            max={100000}
            style={{ width: '100%', boxSizing: 'border-box' }}
            {...register('blockRangeLimit', { required: true, min: 100, valueAsNumber: true })}
          />
          <p style={{ fontSize: `${1 / φ}em`, color: '#aaa', marginTop: '4px' }}>
            Lower if your RPC rejects large log ranges. Default: 10 000.
          </p>
        </div>
      )}

      <button type="submit" disabled={isSubmitting || !anyBoardFound} style={{ margin: 0 }}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
