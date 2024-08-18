import EthereumEmoji from "../assets/emoji/ethereum.png"
import Serverless from "../assets/emoji/serverless-generic.png"
import IPFS from '../assets/emoji/ipfs.png'
import FlyingMoney from '../assets/emoji/flying-money.png'
import Tree from '../assets/emoji/tree.gif'
import Classic from '../assets/emoji/classic.png'
import Optimism from '../assets/emoji/optimism.png'
import Sepolia from '../assets/emoji/sepolia.png'
import OptimismSepolia from '../assets/emoji/optimism-sepolia.png'
import Computer from '../assets/emoji/computer.gif'
import Plug from '../assets/emoji/outlet_plug.png'
import Archive from '../assets/emoji/archive.png'
import Disguise from '../assets/emoji/disguise.png'
import Tips from '../assets/emoji/tips.png'

export const About = () => {
  return (
    <div
      className="flex-wrap-center"
      style={{
          justifyContent: 'space-between',
          padding: '0 5vw',
      }}>
      <div >
      <h3>Welcome to Hashchan</h3>
        <p><img src={EthereumEmoji} className="emoji" /> Threads in Ethereum event logs</p>
        <p><img src={Serverless} className="emoji" /> Runnable Locally</p>
        <p><img src={IPFS} className="emoji" /> Hotlinked/ IPFS pinned images</p>
        <p><img src={FlyingMoney} className="emoji" /> Botnet swarms support ETH</p>
        <p><img src={Tree} className="emoji" /> Just gas, no token no cuts</p>
      </div>
      <div>
        <h3>Supported Chains</h3>
        <p>
          <img src={Classic} className="emoji" />
          <a target="_blank" href="https://etc.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Classic</a>
        </p>
        <p>
          <img src={EthereumEmoji} className="emoji" />
          <a target="_blank" href="https://etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Mainnet</a>
        </p>
        <p>
          <img src={Optimism} className="emoji" />
          <a target="_blank" href="https://optimistic.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Optimism</a>
        </p>
        <p>
          <img src={Sepolia} className="emoji" />
          <a target="_blank" href="https://sepolia.etherscan.io/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Sepolia Testnet</a>
        </p>
        <p>
          <img src={OptimismSepolia} className="emoji" />
          <a target="_blank" href="https://optimism-sepolia.blockscout.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Optimism Sepolia Testnet</a>
        </p>
      </div>
      <div>
        <h3>Powering up Hashchan</h3>
        <p><img src={Computer} className="emoji" /> Run site locally</p>
        <p><img src={Plug} className="emoji" /> Use dedicated websocket RPCs</p>
        <p><img src={Archive} className="emoji" /> Run an Archive Node</p>
        <p><img src={Disguise} className="emoji" /> PseudoAnonymize your wallets</p>
        <p><img src={Tips} className="emoji" /> Tip quality Posts</p>
      </div>
  </div>
  )
}
