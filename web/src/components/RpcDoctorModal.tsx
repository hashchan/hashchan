import { useState } from 'react'
import { FaStethoscope } from 'react-icons/fa6'
import { Modal } from '@/components/Modal'
import { useRpcDoctor, type TestStatus } from '@/hooks/useRpcDoctor'
import { useSettings } from '@hashchan/hooks'

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
  <div style={{ 
      display: 'flex',
      justifyContent: 'space-between',
      padding: `${1/Math.PHI**2}rem 0`
    }}>
    <span>{label}</span>
    <strong style={{ color: STATUS_COLOR[status] }}>{STATUS_LABEL[status]}</strong>
  </div>
)

const RpcDoctorContent = ({ handleClose }: { handleClose: () => void }) => {
  const { run, running, results } = useRpcDoctor()
  const { settings, updateSettings } = useSettings()

  const canApply = results.maxBlockRange !== null && settings?.indexingStrategy === 'reverseChunked'

  const applyRecommended = async () => {
    if (results.maxBlockRange == null) return
    const safe = Math.floor(results.maxBlockRange * (1/Math.PHI + 1/Math.PHI**3))
    await updateSettings({ blockRangeLimit: safe })
  }

  return (
    <Modal name="RPC Doctor" handleClose={handleClose}>
      <div style={{ padding: `${1/Math.PHI}rem`, display: 'flex', flexDirection: 'column', gap: `${1/Math.PHI}rem` }}>

        <div style={{ borderBottom: '1px solid #20C20E20', paddingBottom: `${1/Math.PHI**2}rem` }}>
          <TestRow label="eth_getLogs" status={results.ethGetLogs} />
          <TestRow label="eth_newFilter / eth_getFilterLogs" status={results.ethFilterLogs} />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: `${1/Math.PHI**2}rem 0` }}>
            <span>max block range</span>
            <strong style={{ color: results.maxBlockRange ? '#20C20E' : results.ethFilterLogs === 'idle' ? '#555' : '#ff4444' }}>
              {results.maxBlockRange != null
                ? results.maxBlockRange.toLocaleString()
                : results.ethFilterLogs === 'running' || running
                  ? 'testing...'
                  : '—'}
            </strong>
          </div>
        </div>

        {results.logErrors.length > 0 && (
          <div style={{ fontSize: '0.854em', color: '#ff4444', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {results.logErrors.map((e, i) => (
              <span key={i} style={{ wordBreak: 'break-all' }}>{e}</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: `${1/Math.PHI}rem`, flexWrap: 'wrap' }}>
          <button onClick={run} disabled={running}>
            {running ? 'running...' : 'run diagnostics'}
          </button>
          {canApply && (
            <button onClick={applyRecommended} style={{ color: '#20C20E' }}>
              apply safe range ({Math.floor(results.maxBlockRange! * (1/Math.PHI + 1/Math.PHI**3)).toLocaleString()})
            </button>
          )}
        </div>

      </div>
    </Modal>
  )
}

export const RpcDoctorModal = ({ pxSize }: { pxSize: string }) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button className="flex-wrap-center" onClick={() => setShowModal(v => !v)}>
        {'​'}<FaStethoscope size={pxSize} />
      </button>
      {showModal && <RpcDoctorContent handleClose={() => setShowModal(false)} />}
    </>
  )
}
