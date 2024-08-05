

export const About = () => {
  return (
    <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      <div style={{
        width: '600px'
        }}>
      <h3>Welcome to Hashchan</h3>
        <p> - hidden in ethereum event logs</p>
        <p> - Central Serverless</p>
        <p> - Local Client enabled</p>
        <p> - piggyback on existing image hosters</p>
        <p> - botnets trying to swarm will pad your ethereum bags</p>
        <p> - no profits or hidden fees: just gas</p>
      </div>
      <div style={{
          width: '300px'
        }}>
        <h3>Supported Chains</h3>
        <p> - Classic</p>
        <p> - Mainnet</p>
        <p> - Optimism</p>
        <p> - Sepolia Testnet</p>
        <p> - Optimism Sepolia Testnet</p>
      </div>
      <div>
        <h3>Getting the most out of hashchan</h3>
        <p> - Use your own websocket rpc</p>
        <p> - Even better, run your own archive node</p>
        <p> - use ipfs pinning services for images</p>
      </div>
  </div>
  )
}
