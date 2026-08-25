import { useState } from 'react'
import { FaTableCells } from 'react-icons/fa6'
import { Modal } from '@/components/Modal'
import { cellStates, type Span, type Cell } from '@hashchan/hooks'

// Fibonacci numbers, matching the rest of the app's golden-ratio styling
// conventions: past this many raw blockRangeLimit windows, bucket cells
// together for display rather than rendering one square per window, and
// never fire more than this many scanRange calls from a single click.
const BUCKET_THRESHOLD = 144
const MAX_WINDOWS_PER_CLICK = 21

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
    const scannedCount = windows.filter((w) => w.scanned).length
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

const ScanMapContent = ({
  scanFloor, blockNumber, blockRangeLimit, scannedSpans, scanRange, handleClose,
}: ScanMapProps & { handleClose: () => void }) => {
  const [runningBucket, setRunningBucket] = useState<number | null>(null)

  if (scanFloor == null || blockNumber == null || !blockRangeLimit) {
    return (
      <Modal name="Scan Map" handleClose={handleClose}>
        <div style={{ padding: `${1/Math.PHI}rem` }}>gathering scan range...</div>
      </Modal>
    )
  }

  const cells = cellStates(scannedSpans, Number(scanFloor), Number(blockNumber), Number(blockRangeLimit))
  const bucketSize = cells.length > BUCKET_THRESHOLD ? Math.ceil(cells.length / BUCKET_THRESHOLD) : 1
  const buckets = bucketCells(cells, bucketSize)
  const scannedCells = cells.filter((c) => c.scanned).length

  const handleBucketClick = async (bucket: Bucket, index: number) => {
    if (bucket.scannedFraction === 1 || runningBucket != null) return
    setRunningBucket(index)
    try {
      const unscanned = bucket.windows.filter((w) => !w.scanned).slice(0, MAX_WINDOWS_PER_CLICK)
      for (const window of unscanned) {
        await scanRange(BigInt(window.fromBlock), BigInt(window.toBlock))
      }
    } finally {
      setRunningBucket(null)
    }
  }

  return (
    <Modal name="Scan Map" handleClose={handleClose}>
      <div style={{ padding: `${1/Math.PHI}rem`, display: 'flex', flexDirection: 'column', gap: `${1/Math.PHI}rem` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.854em' }}>
          <span>block {scanFloor.toString()}</span>
          <span>{scannedCells} / {cells.length} windows scanned</span>
          <span>block {blockNumber.toString()}</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
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
                  width: `${1/Math.PHI**2}rem`,
                  height: `${1/Math.PHI**2}rem`,
                  background: empty ? '#444' : '#20C20E',
                  opacity: empty ? 1 : Math.max(bucket.scannedFraction, 0.25),
                  border: '1px solid #20C20E20',
                  cursor: scanned ? 'default' : 'pointer',
                  filter: runningBucket === i ? 'brightness(1.8)' : undefined,
                }}
              />
            )
          })}
        </div>

        <div style={{ fontSize: '0.7rem', color: '#888' }}>
          click an unscanned cell to fetch it
          {bucketSize > 1 ? ` (each covers ${bucketSize} × ${blockRangeLimit.toString()}-block windows, up to ${MAX_WINDOWS_PER_CLICK} fetched per click)` : ''}
        </div>
      </div>
    </Modal>
  )
}

// Trigger + modal, mirroring RpcDoctorModal's pattern: a small icon button
// that toggles the same Modal shell used throughout the app.
export const ScanMap = (props: ScanMapProps) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button className="flex-wrap-center" onClick={() => setShowModal((v) => !v)}>
        <FaTableCells />
      </button>
      {showModal && <ScanMapContent {...props} handleClose={() => setShowModal(false)} />}
    </>
  )
}
