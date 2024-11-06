import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";


export const Instructions = () => {
  return (
    <>
      <h3>First Time Setup</h3>
      <p>The following presents a step by step guide on how to get hashchan up and running.</p><br/>
      <tr>
        <th>Step</th>
        <th>Description</th>
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
        <td>Alchemy RPC</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Hotlinks/IPFS</td>
      </tr>
    </>
  )
}
