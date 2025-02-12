import { useState, useEffect } from 'react'

import Bars from "@/assets/emoji/5-bars.png"
import EthereumEmoji from "@/assets/emoji/ethereum.png"
import Serverless from "@/assets/emoji/serverless-generic.png"
import IPFS from '@/assets/emoji/ipfs.png'
import Robot from '@/assets/emoji/robot.png'
import Tree from '@/assets/emoji/tree.gif'
import Classic from '@/assets/emoji/classic.png'
import Optimism from '@/assets/emoji/optimism.png'
import Fantom from '@/assets/emoji/fantom.png'
import Base from '@/assets/emoji/base.png'
import Sepolia from '@/assets/emoji/sepolia.png'
import OptimismSepolia from '@/assets/emoji/optimism-sepolia.png'
import Avalanche from '@/assets/emoji/avalanche.png'
import Polygon from '@/assets/emoji/polygon.png'
import Computer from '@/assets/emoji/computer.gif'
import Plug from '@/assets/emoji/outlet_plug.png'
import Archive from '@/assets/emoji/archive.png'
import Disguise from '@/assets/emoji/disguise.png'
import Tips from '@/assets/emoji/tips.png'
import ArbitrumOne from '@/assets/emoji/arbitrum-one.png'
import ArbitrumNova from '@/assets/emoji/arbitrum-nova.png'
import Flow from '@/assets/emoji/flow.png'

import HashChan from '@/assets/abi/HashChan3.json'
import {isMobile as deviceIsMobile} from 'react-device-detect'
import { motion, AnimatePresence } from 'motion/react'

import { Title } from '@/components/About/Title'
import { ThreeBoxes, FiveBoxes } from '@/components/About/Boxes'
export const About = () => {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 520 || deviceIsMobile) {
        setIsMobile(true)
      } else {
        setIsMobile(false)
      }
    }
    
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return (<>
    <Title isMobile={isMobile} />
    { isMobile ? (
    <motion.h3
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{delay: 3.8, duration: 0.618}}
      style={{
        marginTop: '5vh',
        textAlign: 'center',
        fontStyle: 'italic',
    }}>
      Imageboards for the Age of the AI Botnet Swarm
    </motion.h3>) 
    :(
    <motion.h2
      initial={{opacity: 0}}
      animate={{opacity: 1}}
      transition={{delay: 3.8, duration: 0.618}}
      style={{
        marginTop: '5vh',
        textAlign: 'center',
        fontStyle: 'italic',
    }}>
      Imageboards for the Age of the AI Botnet Swarm
    </motion.h2>

    ) }
    <div
      className="flex-wrap-center"
      style={{
        marginTop: '45vh',
        marginBottom: '45vh',
        flexDirection: 'column',
      }}
    >
      <ThreeBoxes isMobile={isMobile} />
    </div>
    <div
      className="flex-wrap-center"
      style={{
        marginTop: '50vh',
        marginBottom: '45vh',
        flexDirection: 'column',
      }}
    >
      <FiveBoxes isMobile={isMobile} />
    </div>
    <div className="flex-wrap-center"
      style={{
        marginTop: '35vh',
        marginBottom: '40vh',
        justifyContent: 'space-around',
      }}
    >
      <div>
        <h3 style={{textAlign: 'center'}}>Supported Chains</h3>
        <p>
          <img src={Classic} className="emoji" />
          <a target="_blank" href="https://etc.blockscout.com/address/0x49b98EAB13247E786BEd0bb5780728db8d24b5e0"> Classic</a>
        </p>
        <p>
          <img src={EthereumEmoji} className="emoji" />
          <a target="_blank" href="https://etherscan.io/address/0x16cca36a14b42925d1bec87be2edcf244492d394"> Mainnet</a>
        </p>
        {/*
        <p>
          <img src={Polygon} className="emoji" />
          <a target="_blank" href="https://polygonscan.com/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Polygon</a>
        </p>
        <p>
          <img src={Avalanche} className="emoji" />
          <a target="_blank" href="https://subnets.avax.network/c-chain/address/0x7cE23ee9023A138193C33F060A0060E918246E59"> Avalanche</a>
        </p>
        <p>
          <img src={Fantom} className="emoji" />
          <a target="_blank" href="https://ftmscan.com/address/0xca0296EFC305ba8f2A3035e2846d389A8617c4cf"> Fantom</a>
        </p>
        <p>
          <img src={ArbitrumOne} className="emoji" />
          <a target="_blank" href="https://arbiscan.io/address/0xca0296EFC305ba8f2A3035e2846d389A8617c4cf"> Arbitrum One</a>
        </p>
        <p>
          <img src={ArbitrumNova} className="emoji" />
          <a target="_blank" href="https://nova.arbiscan.io/address/0x77a510184D399C75a91FE9D522aB9e60C2bD08ef"> Arbitrum Nova</a>
        </p>
        <p>
          <img src={Flow} className="emoji" />
          <a target="_blank" href="https://evm.flowscan.io/address/0x49b98EAB13247E786BEd0bb5780728db8d24b5e0"> Flow</a>
        </p>
            */}
        <p>
          <img src={Optimism} className="emoji" />
          <a target='_blank' href={`https://optimistic.etherscan.io/address/${HashChan["10"].address}`}> Optimism</a>
        </p>
        <p>
          <img src={Base} className="emoji" />
          <a target="_blank" href={`https://basescan.org/address/${HashChan["8453"].address}`}> Base</a>
        </p>
        <p>
          <img src={Sepolia} className="emoji" />
          <a target="_blank" href={`https://sepolia.etherscan.io/address/${HashChan["11155111"].address}`}> Sepolia Testnet</a>
        </p>
      </div>
      <div>
        <h3 style={{textAlign: 'center'}}>Powering up Hashchan</h3>
        <p><img src={IPFS} className="emoji" /> Pin with <a target="_blank" href="https://web3.storage">web3.storage</a></p>
        <p><img src={Computer} className="emoji" /> Run site locally</p>
        <p><img src={Plug} className="emoji" /> Use dedicated websocket RPCs</p>
        <p><img src={Archive} className="emoji" /> Run an Archive Node</p>
        <p><img src={Disguise} className="emoji" /> PseudoAnonymize your wallets</p>
        <p><img src={Tips} className="emoji" /> Tip quality Posts</p>
      </div>
  </div>
          </>
  )
}
