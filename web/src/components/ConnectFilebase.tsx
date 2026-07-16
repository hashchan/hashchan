import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useFilebase } from '@/hooks/useFilebase'
import { Modal } from '@/components/Modal'

// A quick, side-effect-free auth check: list pins. Confirms the token is
// valid and scoped to a real bucket before we persist it.
const verifyToken = async (token: string): Promise<boolean> => {
  const res = await fetch('https://rpc.filebase.io/api/v0/pin/ls', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  return res.ok
}

const ConnectFilebaseModal = ({ handleClose }: { handleClose: () => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm()

  const { connect, disconnect, connected } = useFilebase()
  const [status, setStatus] = useState<'idle' | 'error'>('idle')

  const onSubmit = async (data) => {
    setStatus('idle')
    const ok = await verifyToken(data.token)
    if (!ok) {
      setStatus('error')
      return
    }
    connect({ token: data.token, bucket: data.bucket || undefined })
  }

  return (
    <Modal name="Connect Filebase" handleClose={handleClose}>
      <form
        className="flex-wrap-center"
        style={{ flexDirection: 'column' }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex-wrap-center" style={{ flexDirection: 'column' }}>
          <h3>Pin uploads to your own <i>IPFS</i> <a target="_blank" href="https://filebase.com">Filebase</a> bucket</h3>
          <p>
            Sign up at <a target="_blank" href="https://filebase.com">filebase.com</a>, create a bucket,
            then in the Access Keys console&apos;s <i>IPFS API</i> tab generate an IPFS RPC API token scoped
            to that bucket. Paste the token below — HashChan never sees your account&apos;s main access key.
          </p>

          <label htmlFor="bucket">Bucket name</label>
          <input style={{ width: '261px' }} defaultValue="" {...register('bucket', { required: false })} />

          <label htmlFor="token">IPFS RPC API Token</label>
          <input type="password" style={{ width: '261px' }} defaultValue="" {...register('token', { required: true })} />
          {errors.token && <span>This field is required</span>}

          <button disabled={isSubmitting} type="submit">Connect</button>
          {connected && (
            <button type="button" onClick={disconnect}>
              Disconnect
            </button>
          )}

          {isSubmitting && <p>Verifying token...</p>}
          {status === 'error' && <p style={{ color: '#ff0000' }}>Couldn&apos;t authenticate with that token — check it and try again.</p>}
          {connected && status !== 'error' && !isSubmitting && (
            <p style={{ color: '#20C20E' }}>✓ Connected. You can close this window.</p>
          )}
        </div>
      </form>
    </Modal>
  )
}

// Dropdown-item trigger only — the currently active provider's name is shown
// by the composition layer (useActivePinningProvider) directly in the nav
// bar, not duplicated here. Opens the modal whether or not already connected,
// so the user can reconfigure or disconnect.
export const ConnectFilebase = () => {
  const [showModal, setShowModal] = useState(false)
  const handleShowModal = () => setShowModal(!showModal)
  const { connected } = useFilebase()

  return (
    <>
      <button onClick={handleShowModal}>
        {connected ? 'Filebase ✓' : 'Filebase'}
      </button>
      {showModal && <ConnectFilebaseModal handleClose={handleShowModal} />}
    </>
  )
}
