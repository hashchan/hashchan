import { useState, useEffect, ReactNode } from 'react'
import HashchanLogo from '@/assets/logo-4.png'
import HashchanLogoGif from '@/assets/animated-banner.gif'
import HashchanLogoGlitchGif from '@/assets/glitched-logo.gif'
import {FaGithub, FaSquareXTwitter, FaDiscord, FaBook, FaYoutube} from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'
import { ConnectW3Storage } from './ConnectW3Storage'

const HomeButton = () => {
  const [homeHover, setHomeHover] = useState(false)
  const [logo, setLogo] = useState(HashchanLogoGif)
  const handleHomeHover = (inside:boolean) => {
    if (inside) {
      const roll = Math.random()
      setLogo(roll > 0.5 ? HashchanLogoGif : HashchanLogoGlitchGif)
    } else {
      setLogo(HashchanLogo)
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
          padding: '0.618vh 0.618vw',
        }}>
        [<Link to="/boards/pol/catalogue">pol</Link>,&nbsp;
        <Link to="/boards/biz/catalogue">biz</Link>,&nbsp;
        <Link to="/boards/g/catalogue">g</Link>,&nbsp;
        <Link to="/boards/sci/catalogue">sci</Link>,&nbsp;
        <Link to="/boards/x/catalogue">x</Link>]
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
          to="docs/v1/intro"
        >
          <FaBook size="31.25px" />
        </Link>
        <IconLink href="https://github.com/hashchan/hashchan" Logo={<FaGithub size="31.25px"/>} />
        <IconLink href="https://twitter.com/0xhashchan" Logo={<FaSquareXTwitter size="31.25px" />} />
        <IconLink href="https://discord.gg/ZQPA5MQHa6" Logo={<FaDiscord size="31.25px" />} />
        <IconLink href="https://youtube.com/@0xhashchan" Logo={<FaYoutube size="31.25px" />} />
      </div>
    </div>
  )
}
