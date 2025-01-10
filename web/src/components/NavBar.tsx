import { Fragment, useState, useEffect, ReactNode } from 'react'
import HashchanLogo from '@/assets/logo-4.png'
import HashchanLogoGif from '@/assets/animated-banner.gif'
import HashchanBanner from '@/assets/animated-banner-2.gif'
import HashchanBannerNoRepeat from '@/assets/hashchan-banner-no-repeat.gif'
import HashchanGaussianBlur from  '@/assets/logo-gaussian-blur.gif'
import HashchanGaussianBlurNoRepeat from  '@/assets/logo-gaussian-blur-no-repeat.gif'
import HashchanLogoGlitchGif from '@/assets/glitched-logo.gif'
import {FaGithub, FaSquareXTwitter, FaDiscord, FaBook, FaYoutube} from 'react-icons/fa6'
import { GiMagicBroom, GiBookshelf } from 'react-icons/gi'
import { Link } from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'
import { ConnectW3Storage } from './ConnectW3Storage'
import { BoardsList } from '@/components/HashChan/BoardsList'

const HomeButton = () => {
  const [homeHover, setHomeHover] = useState(false)
  const [logo, setLogo] = useState(HashchanGaussianBlurNoRepeat)
  const handleHomeHover = (inside:boolean) => {
    if (inside) {
      setLogo(HashchanGaussianBlur)
    } else {
      setLogo(HashchanGaussianBlurNoRepeat)
    }
  }

  return (
    <Link className="button" to="/">
      <img 
        onMouseEnter={() => handleHomeHover(true)}
        onMouseLeave={() => handleHomeHover(false)}
        src={logo}/></Link>
  )
}


const IconLink = ({href, Logo}: {href: string, Logo: ReactNode}) => {
  return (
    <a
      className="nav-icon"
      href={href}
      target="_blank"
    >
      {Logo}
    </a>
  )
}

export const NavBar = () => {
  const pxSize = `${100 / (Math.PHI**3) }px`
  return (
    <div
      className="flex-wrap-center"
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <HomeButton />
      <div
        className="flex-wrap-center"
        style={{
          padding: `${Math.PHI - 1}vh ${Math.PHI - 1}vw`,
        }}>
        <BoardsList />
      </div>
      <ConnectWallet />
      <ConnectW3Storage />
      <div
        className="flex-wrap-center"
        style={{
          justifyContent: 'space-between', 
        }}
      >
        <Link
          className="nav-icon"
          to="janitors"
        >
          <GiMagicBroom size={pxSize} />
        </Link>
        <Link
          className="nav-icon"
          to="docs/v1/intro"
        >
          <GiBookshelf size={pxSize} />
        </Link>
        <IconLink href="https://github.com/hashchan/hashchan" Logo={<FaGithub size={pxSize} />} />
        <IconLink href="https://twitter.com/0xhashchan" Logo={<FaSquareXTwitter size={pxSize}   />} />
        <IconLink href="https://discord.gg/ZQPA5MQHa6" Logo={<FaDiscord size={pxSize}  />} />
        <IconLink href="https://youtube.com/@0xhashchan" Logo={<FaYoutube size={pxSize} />} />
      </div>
    </div>
  )
}
