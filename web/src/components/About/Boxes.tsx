import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import EthereumEmoji from '@/assets/emoji/ethereum.png'
import Robot from '@/assets/emoji/robot.png'
import Tree from '@/assets/emoji/tree.gif'

import Disguise from '@/assets/emoji/disguise.png'
import IPFS from '@/assets/emoji/ipfs.png'
import Scale from '@/assets/emoji/scale.png'
import Ufo from '@/assets/emoji/ufo.png'
import Note from '@/assets/emoji/note.png'
const Box = ({
  isMobile,
  logo,
  title,
  description
}:{
  isMobile: boolean
  logo: string
  title: string
  description: string
}) => {

  const LogoDiv = () => (
      <motion.img
        animate={{
          filter: [
            `hue-rotate(${Math.random() * 360}deg)`,
            `hue-rotate(${Math.random() * 360}deg)`,
          ]
        }}
        transition={{
          duration: 1,
          ease: "linear",
          repeat: Infinity
        }}
        style={{
          height: '128px',
        }}
        src={logo}/>
  )

  return (
    <motion.div style={{
      marginTop: '5vh',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 1.3vw',
      gap: '5px',
      width: isMobile ? '90vw' : '30vw',
      minWidth: isMobile ? '200px' : '400px',
      }}>
      { !isMobile && <LogoDiv/>}
      <div 
        className="flex-wrap-center"
        style={{
          flexDirection: 'column',
        }}
      >{ isMobile && <LogoDiv/>}
        <h3 style={{textAlign: 'center'}}><i>{title}</i></h3>
        <p style={{textAlign: 'center'}}>{description}</p>
      </div>
    </motion.div>
  )
}



export const ThreeBoxes = ({isMobile}:{isMobile: boolean}) => {

  return (
    <div className="flex-wrap-center">
      <Box
        isMobile={isMobile}
        logo={EthereumEmoji}
        title="Powered By Ethereum"
        description="immutable, uncensorable record of all posts"
      />
      <Box
        isMobile={isMobile}
        logo={Robot}
        title="Resistant to Botswarms"
        description="Prevents Spam economically, without Cloudflare"
      />
      <Box
        isMobile={isMobile}
        logo={Tree}
        title="Efficient"
        description="No tokens, no cuts - gas only"
      />
    </div>
  )
}


export const FiveBoxes = ({isMobile}:{isMobile: boolean}) => {

  return (
    <div className="flex-wrap-center">
      <Box
        isMobile={isMobile}
        logo={Disguise}
        title="Togglable Anonymity"
        description="Fund new addresses with different techniques to build rep or remain anonymous"
      />
      <Box
        isMobile={isMobile}
        logo={Scale}
        title="Stackable Moderation Services"
        description="Choose who filters your content, if any"
      />
      <Box
        isMobile={isMobile}
        logo={IPFS}
        title="Hotlinked/ IPFS pinned images"
        description="Users are never liable for illegal content"
      />
      <Box
        isMobile={isMobile}
        logo={Ufo}
        title="Storm Eglin and J33"
        description="Mass adoption forces deepstate adoption, boosting crypto prices"
      />
      <Box
        isMobile={isMobile}
        logo={Note}
        title="Fair Use Ready"
        description="Have your content retroactively rewarded by AI companies when fair use laws apply"
      />
    </div>
  )
}
