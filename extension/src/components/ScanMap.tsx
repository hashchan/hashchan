import { useState } from 'react'
import { cellStates, type Span, type Cell } from '@hashchan/hooks'

const φ = Math.PHI

// Fibonacci numbers, matching the rest of the app's golden-ratio styling
// conventions: past this many raw blockRangeLimit windows, bucket cells
// together for display rather than rendering one square per window, and
// never fire more than this many scanRange calls from a single click.
// Lower than web's threshold since the sidebar is much narrower.
const BUCKET_THRESHOLD = 55
const MAX_WINDOWS_PER_CLICK = 21
// Fixed px, not em — cell size nested inside the container's own scaled-down
// font-size (1/φ em) was compounding into a ~3px dot, unreadable/unclickable.
const CELL_PX = 16

interface Bucket {
  fromBlock: number
  toBlock: number
  scannedFraction: number
  windows: Cell[]
}

const bucketCells = (cells: Cell[], bucketSize: number): Bucket[] => {
  const buckets: Bucket[] = []
  for (let i = 0; i < cells.length; i += bucketSize) {
    const windows = cells.slice(i, i + bucketSize)
    const scannedCount = windows.filter(w => w.scanned).length
    buckets.push({
      fromBlock: windows[0].fromBlock,
      toBlock: windows[windows.length - 1].toBlock,
      scannedFraction: scannedCount / windows.length,
      windows,
    })
  }
  return buckets
}

export interface ScanMapProps {
  scanFloor: bigint | null | undefined
  blockNumber: bigint | undefined
  blockRangeLimit: bigint | undefined
  scannedSpans: Span[]
  scanRange: (fromBlock: bigint, toBlock: bigint) => Promise<void>
}

export const ScanMap = ({ scanFloor, blockNumber, blockRangeLimit, scannedSpans, scanRange }: ScanMapProps) => {
  const [runningBucket, setRunningBucket] = useState<number | null>(null)

  if (scanFloor == null || blockNumber == null || !blockRangeLimit) {
    return null
  }

  const cells = cellStates(scannedSpans, Number(scanFloor), Number(blockNumber), Number(blockRangeLimit))
  const bucketSize = cells.length > BUCKET_THRESHOLD ? Math.ceil(cells.length / BUCKET_THRESHOLD) : 1
  const buckets = bucketCells(cells, bucketSize)
  const scannedCells = cells.filter(c => c.scanned).length

  const handleBucketClick = async (bucket: Bucket, index: number) => {
    if (bucket.scannedFraction === 1 || runningBucket != null) return
    setRunningBucket(index)
    try {
      const unscanned = bucket.windows.filter(w => !w.scanned).slice(0, MAX_WINDOWS_PER_CLICK)
      for (const w of unscanned) {
        await scanRange(BigInt(w.fromBlock), BigInt(w.toBlock))
      }
    } finally {
      setRunningBucket(null)
    }
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: `${1 / φ ** 2}em`,
      padding: `${1 / φ ** 2}em`,
      border: '1px solid #20C20E20',
      fontSize: `${1 / φ}em`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff' }}>
        <span>scan map</span>
        <span>{scannedCells} / {cells.length} scanned</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        {buckets.map((bucket, i) => {
          const scanned = bucket.scannedFraction === 1
          const empty = bucket.scannedFraction === 0
          return (
            <div
              key={i}
              title={
                `${bucket.fromBlock} – ${bucket.toBlock}` +
                (bucket.windows.length > 1 ? ` (${bucket.windows.length} windows)` : '') +
                (scanned ? ' — scanned' : empty ? ' — click to scan' : ` — ${Math.round(bucket.scannedFraction * 100)}% scanned, click to fill in`)
              }
              onClick={() => handleBucketClick(bucket, i)}
              style={{
                width: `${CELL_PX}px`,
                height: `${CELL_PX}px`,
                background: empty ? '#444' : '#20C20E',
                opacity: empty ? 1 : Math.max(bucket.scannedFraction, 0.25),
                border: '1px solid #20C20E20',
                borderRadius: '2px',
                cursor: scanned ? 'default' : 'pointer',
                filter: runningBucket === i ? 'brightness(1.8)' : undefined,
                flexShrink: 0,
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
