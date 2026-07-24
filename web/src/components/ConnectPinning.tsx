import { FaThumbtack } from 'react-icons/fa6'
import { DropDown } from '@/components/DropDown'
import { useActivePinningProvider } from '@/hooks/useActivePinningProvider'
import { ConnectKubo } from './ConnectKubo'
import { ConnectFilebase } from './ConnectFilebase'
import { ConnectW3Storage } from './ConnectW3Storage'

// Pure composition layer over the independent pinning-provider integrations
// — it renders all of them, it doesn't share logic between them. Kubo,
// Filebase, and Storacha remain free to change, or (for Storacha) be deleted
// entirely, without touching each other or this wrapper's internals. Kubo is
// listed first since it's the "bring your own node" default. Mirrors
// ConnectWallet's chain-select pattern: the dropdown just lets you open
// either provider's connect UI, while the currently active provider's name
// is shown inline in the nav bar, not inside the dropdown.
const itemStyle = {
  margin: '5px 8px',
  padding: '5px 8px',
}

export const ConnectPinning = () => {
  const { label, active, disconnect } = useActivePinningProvider()

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <DropDown name={<FaThumbtack />}>
        <div style={itemStyle}><ConnectKubo /></div>
        <div style={itemStyle}><ConnectFilebase /></div>
        <div style={itemStyle}><ConnectW3Storage /></div>
      </DropDown>
      <span style={{ paddingRight: '1.382vw' }}>{label || 'No Pinning Provider'}</span>
      {(active === 'kubo' || active === 'filebase') && (
        <button onClick={disconnect}>Disconnect</button>
      )}
    </div>
  )
}
