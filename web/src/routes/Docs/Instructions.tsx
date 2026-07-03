import type { ReactNode } from 'react'
import AddMetamask from '@/assets/video/metamask-add.webm'

const Tip = ({ children }: { children: ReactNode }) => (
  <div style={{
    borderLeft: '2px solid #20C20E',
    backgroundColor: 'rgba(32, 194, 14, 0.05)',
    padding: `${Math.PHI}vh ${Math.PHI}vw`,
    marginTop: `${Math.PHI}vh`,
  }}>
    <span style={{ color: '#20C20E', fontWeight: 'bold', fontSize: `${1/Math.PHI + 1/Math.PHI**3}em` }}>💡 tip</span>
    <div style={{ marginTop: `${1 / Math.PHI}vh` }}>{children}</div>
  </div>
)

const Step = ({ num, title, isLast = false, children }: {
  num: number
  title: string
  isLast?: boolean
  children: ReactNode
}) => (
  <div style={{ display: 'flex', flexDirection: 'row', gap: `${Math.PHI ** 2}vw` }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
      <div style={{
        width: `${Math.PHI ** 3}vh`,
        height: `${Math.PHI ** 3}vh`,
        border: '1px solid #20C20E',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#20C20E',
        flexShrink: 0,
      }}>
        {num}
      </div>
      {!isLast && (
        <div style={{
          width: '1px',
          flex: 1,
          backgroundColor: '#20C20E',
          opacity: 0.25,
          marginTop: `${1 / Math.PHI}vh`,
        }} />
      )}
    </div>

    <div style={{ flex: 1, paddingBottom: isLast ? 0 : `${Math.PHI ** 2}vh` }}>
      <h4 style={{ marginTop: 0, marginBottom: `${Math.PHI}vh` }}>{title}</h4>
      {children}
    </div>
  </div>
)

export const Instructions = () => {
  return (
    <div
      className="flex-wrap-center"
      style={{
        flexDirection: 'column',
        margin: '0 auto',
        width: `${(100 / Math.PHI) + (100 / Math.PHI ** 3)}vw`,
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      <h3>First Time Setup</h3>
      <p style={{ marginBottom: `${Math.PHI ** 2}vh`, opacity: 0.6 }}>
        Four steps to get hashchan up and running.
      </p>

      <Step num={1} title="Connect your wallet">
        <p>
          The most common option is{' '}
          <a href="https://support.metamask.io/getting-started/getting-started-with-metamask/" target="_blank">
            MetaMask
          </a>. Install the browser extension and create or import a wallet.
        </p>
        <video style={{ width: '100%', marginTop: `${Math.PHI}vh` }} playsInline autoPlay controls src={AddMetamask} />
        <Tip>On mobile, the MetaMask app includes a built-in browser — use it to access the dapp directly from your phone.</Tip>
      </Step>

      <Step num={2} title="Fund the wallet">
        <p>
          Funding options vary by region. Search <em>"how to get Ethereum in [your country]"</em> for local exchanges or on-ramps.
        </p>
        <Tip>Want to try the dapp first? Reach out on Discord and we can send you some Sepolia testETH to get started.</Tip>
      </Step>

      <Step num={3} title="Dedicated RPC">
        <p>
          An RPC is your connection to the blockchain. If you went with Metamask you get <a target="_blank" href="infura.io">Infuras</a> nodes built in, which have done a very good job fetching logs. Outside of metamask default wallet endpoints are often rate-limited — you will likely have to open the settings modal and select <i>reverse chunked and fiddle with the max block height</i>
        </p>
        <p style={{ marginTop: `${Math.PHI}vh` }}>
          Get a free dedicated RPC from <a target="_blank" href="https://infura.io">Infura</a>, then add it to your wallet's network settings for reliable access.
        </p>
      </Step>

      <Step num={4} title="Hotlinks / IPFS" isLast>
        <p>
          Hashchan records image URLs on-chain rather than hosting images — paste any publicly accessible URL and it's stored on the blockchain.
        </p>
        <Tip>
          For permanent, self-hosted images use an IPFS pinning service like{' '}
          <a target="_blank" href="https://pinata.cloud/">Pinata</a> or{' '}
          <a target="_blank" href="https://storacha.network">Storacha</a>.
          Hashchan has a built-in We integration (just needs your email) — optional but recommended.
        </Tip>
      </Step>
    </div>
  )
}
