import EthereumEmoji from "../assets/emoji/ethereum.png"
import Serverless from "../assets/emoji/serverless-generic.png"
import IPFS from '../assets/emoji/ipfs.png'
import FlyingMoney from '../assets/emoji/flying-money.png'
import Tree from '../assets/emoji/tree.gif'
export const About = () => {
  return (
    <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}>
      <div >
      <h3>Welcome to Hashchan</h3>
        <p><img src={EthereumEmoji} className="emoji" /> Threads in Ethereum event logs</p>
        <p><img src={Serverless} className="emoji" /> Runnable Locally</p>
        <p><img src={IPFS} className="emoji" /> Hotlinked/ IPFS pinned images</p>
        <p><img src={FlyingMoney} className="emoji" /> Botnet swarms support ETH</p>
        <p><img src={Tree} className="emoji" /> Just Network fees, no token or cuts</p>
      </div>
      <div>
        <h3>Supported Chains</h3>
        <p>
        <a target="_blank" href="https://etc.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59">Classic</a>
        </p>
        <p>
        <a target="_blank" href="https://etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59">Mainnet</a>
        </p>
        <p>
        <a target="_blank" href="https://optimistic.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59">Optimism</a>
        </p>
        <p>
        <a target="_blank" href="https://sepolia.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59">Sepolia Testnet</a>
        </p>
        <p>
        <a target="_blank" href="https://optimism-sepolia.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59">Optimism Sepolia Testnet</a>
        </p>
      </div>
      <div>
        <h3>Getting the most out of hashchan</h3>
        <p>Use your own websocket rpc</p>
        <p>Even better, run your own archive node</p>
        <p>use ipfs pinning services for images</p>
      </div>
  </div>
  )
}
