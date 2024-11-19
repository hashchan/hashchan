import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import AddMetamask from '@/assets/video/metamask-add.webm'

export const Instructions = () => {
  return (
    <div
      className="flex-wrap-center"
      style={{
        flexDirection: 'column',
        margin: '0 auto',
        width: `${(100/ (Math.PHI) + (100/(Math.PHI**3)))}vw`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div><h3>First Time Setup</h3></div>
      <p>The following presents a step by step guide on how to get hashchan up and running.</p><br/>
      <div>
        <table>
          <tbody>
            <tr>
              <td>Step</td>
              <td>Description</td>
            </tr>
            <tr>
              <td>1</td>
              <td>Connect your wallet</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Funding the Wallet</td>
            </tr>
            <tr>
              <td>3</td>
              <td>Dedicated RPC</td>
            </tr>
            <tr>
              <td>4</td>
              <td>Hotlinks/IPFS</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h4>1. Connect your wallet</h4>
        <p>There are many options, though the most common is Metamask. Instructions and descriptions can be found <a href="https://support.metamask.io/getting-started/getting-started-with-metamask/" target="_blank">here</a> additionally, if you are on mobile, the metamask app has its own browser inside that lets you use the dapp on your phone</p>
        <video style={{width: '100%'}} playsInline autoPlay controls src={AddMetamask} />
        <h4>2. Funding the Wallet</h4>
        <p>Funding a wallet is highly dependent on ones locality, I recommend to search "how to get etheruem in X country".  For now, If you reach out via discord I may be able to send you some testETH on the sepolia network to get you started trying the dapp out"</p>
        <h4>3. Dedicated RPCs</h4>
        <p>an RPC faciliates your communication with the blockchain.  While the dapp seems to be currently surviving on many default endpoints, it is not guaranteed.  And one may find they have to refresh the page to see new posts. While metamask and other wallet providers give you default ones, they are often restricted in what they can access due to rate limiting.  To guarantee you can access posts and threads, it is recommended to get a dedicated RPC url from a provider such as <a target="_blank" href="https://www.alchemy.com/">Alchemy</a>.  By editing the network in metamask you can add a new RPC and get much better log access</p>
        <h4>4. Hotlinks/IPFS</h4>
        <p>Hashchan avoids the issue of illegal content flooding by relying on existing service providers or the end users to provider their own images.  The process of piggybacking off another providers image hosting is refered to as hotlinking.  Simply provide the url to the image, and hashchan will record it on the blockchain.  Unfortunately some providers restrict access to hotlinking, and users have to rely on them not to swap the image behind the url.  For this reason it is recommended users leverage IPFS pinning services to host their images such as <a target="_blank" href="https://pinata.cloud/">Pinata</a> or <a target="_blank" href="https://web3.storage">Web3.Storage</a> Hashchan has a web3.storage integration that allows users to host their images rather conveinently, though it requires a user provider their email address. This part is optional but highly recommended</p>
      </div>
    </div>
  )
}
