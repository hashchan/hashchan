import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useKubo } from '@/hooks/useKubo'
import { Modal } from '@/components/Modal'

// A quick, side-effect-free reachability check: Kubo's /api/v0/id RPC just
// echoes back the node's own peer info. Confirms the endpoint is a real,
// reachable Kubo RPC API (and that CORS is configured) before we persist it.
const verifyEndpoint = async (endpointUrl: string): Promise<boolean> => {
  try {
    const res = await fetch(`${endpointUrl.replace(/\/$/, '')}/api/v0/id`, { method: 'POST' })
    return res.ok
  } catch {
    return false
  }
}

// Presets for the common case; "custom" reveals a free-text field for
// anything else (e.g. the node's own gateway, if it's internet-facing).
const GATEWAY_PRESETS: Record<string, string> = {
  none: '',
  dweb: 'https://dweb.link',
}

const CopyableCommand = ({ command }: { command: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="flex-wrap-center" style={{ flexDirection: 'column', width: '100%', margin: '4px 0' }}>
      <code
        className="break-words"
        style={{ width: '100%', boxSizing: 'border-box', padding: '4px 8px', background: '#161B22' }}
      >
        {command}
      </code>
      <button type="button" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

const ConnectKuboModal = ({ handleClose }: { handleClose: () => void }) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { endpointUrl: 'http://127.0.0.1:5001', gatewayPreset: 'dweb', gatewayUrl: '' } })

  const { connect, disconnect, connected } = useKubo()
  const [status, setStatus] = useState<'idle' | 'error'>('idle')
  const gatewayPreset = watch('gatewayPreset')

  const onSubmit = async (data) => {
    setStatus('idle')
    const ok = await verifyEndpoint(data.endpointUrl)
    if (!ok) {
      setStatus('error')
      return
    }
    const gatewayUrl = data.gatewayPreset === 'custom' ? data.gatewayUrl : GATEWAY_PRESETS[data.gatewayPreset]
    connect({ endpointUrl: data.endpointUrl, gatewayUrl: gatewayUrl || undefined })
  }

  return (
    <Modal name="Connect Kubo" handleClose={handleClose}>
      <form
        className="flex-wrap-center"
        style={{ flexDirection: 'column' }}
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="flex-wrap-center" style={{ flexDirection: 'column' }}>
          <h3>Pin uploads to your own <i>IPFS</i> node</h3>
          <p>
            Run your own <a target="_blank" href="https://docs.ipfs.tech/install/command-line/">Kubo</a> node
            (<code>ipfs daemon</code>) and point HashChan at its RPC API. Kubo needs CORS enabled for
            browser calls — run these, then restart the daemon:
          </p>
          <CopyableCommand command={`ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["*"]'`} />
          <CopyableCommand command={`ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST"]'`} />
          <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
            Kubo&apos;s RPC API has no built-in auth — anyone who can reach this address can pin and manage
            the node, so don&apos;t expose it beyond localhost/your LAN.
          </p>

          <label htmlFor="endpointUrl">Kubo RPC API endpoint</label>
          <input
            style={{ width: '261px' }}
            {...register('endpointUrl', { required: true })}
          />
          {errors.endpointUrl && <span>This field is required</span>}

          <label htmlFor="gatewayPreset">Public gateway (optional)</label>
          <select style={{ width: '261px' }} {...register('gatewayPreset')}>
            <option value="dweb">dweb.link</option>
            <option value="none">None — fetch directly over IPFS from your node</option>
            <option value="custom">Custom URL…</option>
          </select>
          {gatewayPreset === 'custom' && (
            <input
              style={{ width: '261px' }}
              placeholder="https://your-gateway.example"
              {...register('gatewayUrl', { required: gatewayPreset === 'custom' })}
            />
          )}
          {errors.gatewayUrl && <span>This field is required</span>}
          <p style={{ margin: '4px 0', fontSize: '0.9em' }}>
            A public gateway (like dweb.link) fetches your upload on your behalf, so any viewer can see it
            regardless of their network. Picking &quot;None&quot; instead relies on other viewers&apos;
            browsers reaching your node directly — this usually only works on your own machine or LAN, not
            for the general public, unless your node is specifically set up to be reachable from outside.
          </p>

          <button disabled={isSubmitting} type="submit">Connect</button>
          {connected && (
            <button type="button" onClick={disconnect}>
              Disconnect
            </button>
          )}

          {isSubmitting && <p>Verifying node...</p>}
          {status === 'error' && <p style={{ color: '#ff0000' }}>Couldn&apos;t reach that endpoint — check the URL and CORS config and try again.</p>}
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
export const ConnectKubo = () => {
  const [showModal, setShowModal] = useState(false)
  const handleShowModal = () => setShowModal(!showModal)
  const { connected } = useKubo()

  return (
    <>
      <button onClick={handleShowModal}>
        {connected ? 'Kubo ✓' : 'Kubo'}
      </button>
      {showModal && <ConnectKuboModal handleClose={handleShowModal} />}
    </>
  )
}
