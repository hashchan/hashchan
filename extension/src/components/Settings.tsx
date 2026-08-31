import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useConnection } from 'wagmi'
import { useBoards, useHookSettings, useRpcDoctor } from '@hashchan/hooks'
import type { RpcDoctorTestStatus as TestStatus } from '@hashchan/hooks'
import { saveSiteSettings } from '../hooks/useSiteSettings'
import type { Board } from '@hashchan/hooks'
import type { SiteContext } from '../hooks/useSiteContext'

const φ = Math.PHI

const STATUS_COLOR: Record<TestStatus, string> = {
  idle:    '#555',
  running: '#f0c040',
  pass:    '#20C20E',
  fail:    '#ff4444',
}

const STATUS_LABEL: Record<TestStatus, string> = {
  idle:    '—',
  running: 'testing...',
  pass:    'pass',
  fail:    'fail',
}

const TestRow = ({ label, status }: { label: string; status: TestStatus }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${1 / φ ** 2}em 0` }}>
    <span>{label}</span>
    <strong style={{ color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</strong>
  </div>
)

const RpcDoctorPanel = () => {
  const { run, running, results } = useRpcDoctor()
  const { hookSettings } = useHookSettings()

  return (
    <div style={{ border: '1px solid #20C20E20', padding: `${1 / φ}em`, display: 'flex', flexDirection: 'column', gap: `${1 / φ ** 2}em` }}>
      <TestRow label="eth_getLogs" status={results.ethGetLogs} />
      <TestRow label="eth_newFilter / eth_getFilterLogs" status={results.ethFilterLogs} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${1 / φ ** 2}em 0` }}>
        <span>max block range</span>
        <strong style={{ color: results.maxBlockRange ? '#20C20E' : results.ethFilterLogs === 'idle' ? '#555' : '#ff4444' }}>
          {results.maxBlockRange != null
            ? results.maxBlockRange.toLocaleString()
            : results.ethFilterLogs === 'running' || running
              ? 'testing...'
              : '—'}
        </strong>
      </div>

      {results.logErrors.length > 0 && (
        <div style={{ fontSize: `${1 / φ}em`, color: '#ff4444', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {results.logErrors.map((e, i) => (
            <span key={i} style={{ wordBreak: 'break-all' }}>{e}</span>
          ))}
        </div>
      )}

      <button type="button" onClick={run} disabled={running} style={{ margin: 0 }}>
        {running ? 'running...' : 'run diagnostics'}
      </button>

      {/* run() applies the detected safe range to HookSettings itself — no separate apply step needed. */}
      {hookSettings?.maxBlockRangeDetected != null && (
        <div style={{ fontSize: `${1 / φ}em`, color: '#20C20E' }}>
          applied block range limit: {hookSettings.blockRangeLimit.toLocaleString()}
          {' '}(detected max: {hookSettings.maxBlockRangeDetected.toLocaleString()})
        </div>
      )}
    </div>
  )
}

const SITE_BOARDS = [
  { siteId: 'youtube'       as const, symbol: 'yt',     label: '/yt/ — YouTube' },
  { siteId: 'wikipedia'     as const, symbol: 'wiki',   label: '/wiki/ — Wikipedia' },
  { siteId: 'rottentomatoes'as const, symbol: 'rt',     label: '/rt/ — Rotten Tomatoes' },
  { siteId: 'reddit'        as const, symbol: 'rdt',    label: '/rdt/ — Reddit' },
  { siteId: 'x'             as const, symbol: 'x',      label: '/x/ — X' },
]

export const Settings = ({ ctx }: { ctx: SiteContext | null }) => {
  const { address, chainId } = useConnection()
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards()
  const { hookSettings, updateHookSettings } = useHookSettings()
  const [showSuccess, setShowSuccess] = useState(false)

  const { register, handleSubmit, watch, reset, formState: { isSubmitting } } = useForm({
    defaultValues: {
      indexingStrategy: 'fullNode' as 'fullNode' | 'reverseChunked' | 'bulkScrape',
      blockRangeLimit: 10000,
    },
  })

  const indexingStrategy = watch('indexingStrategy')

  useEffect(() => {
    if (hookSettings) {
      reset({
        indexingStrategy: hookSettings.indexingStrategy,
        blockRangeLimit: hookSettings.blockRangeLimit,
      })
    }
  }, [hookSettings, reset])

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
    await updateHookSettings({
      indexingStrategy: data.indexingStrategy,
      blockRangeLimit: Number(data.blockRangeLimit),
    })
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 3000)
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      style={{ display: 'flex', flexDirection: 'column', gap: `${1 / φ}em` }}
    >
      {!ctx && (
        <p style={{
          margin: 0,
          padding: `${1 / φ ** 2}em`,
          border: '1px solid #55555550',
          color: '#aaa',
          fontSize: `${1 / φ}em`,
        }}>
          Navigate to a supported site — YouTube, Wikipedia, Rotten Tomatoes, Reddit, X, or GitHub — to link the current page to a board. The settings below still apply globally.
        </p>
      )}

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

      {/* Always visible, not gated on reverseChunked — useful for deciding
          which strategy to pick in the first place, not just for tuning one
          you've already chosen. */}
      <div>
        <label style={{ display: 'block', marginBottom: `${1 / φ ** 2}em` }}>RPC Diagnostics</label>
        <RpcDoctorPanel />
      </div>

      <button type="submit" disabled={isSubmitting || !anyBoardFound} style={{ margin: 0 }}>
        {isSubmitting ? 'Saving...' : 'Save'}
      </button>
      {showSuccess && (
        <p style={{ color: '#20C20E', margin: 0, textAlign: 'center' }}>Settings saved</p>
      )}
    </form>
  )
}
