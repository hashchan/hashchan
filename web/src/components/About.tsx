

export const About = () => {
  return (
    <div style={{
        display: 'grid'
      }}>
      <h3>Welcome to Hashchan</h3>
      <p> - hidden in ethereum event logs</p><br/>
      <p> - Central Serverless</p><br/>
      <p> - Local Client enabled</p><br/>
      <p> - piggyback on existing image hosters</p><br/>
      <p> - botnets trying to swarm will pad your ethereum bags</p><br/>
      <p> - no profits or hidden fees: just gas</p><br/>
      <h3>Supported Chains</h3>
      <p>Mainnet</p>
      <p>Optimism</p>
      <p>Sepolia Testnet</p>
      <p>Optimism Sepolia Testnet</p>
      <h3>Getting the most out of hashchan</h3>
      <p>Dont use default public rpcs, go to alchemy, infura, get the free tier and paste the websocket apis into metamask</p>
      <p>Even better, run your own archive node of the chain you'd like to use</p>
      <p>Phone posting is buggy, and walletconnect is a central point of failure, use desktop at least for now</p>
  </div>
  )
}
