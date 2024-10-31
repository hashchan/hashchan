import { useState, ReactNode } from 'react'
import HashchanLogo from '@/assets/logo-4.png'
import HashchanLogoGif from '@/assets/animated-banner.gif'
import {FaGithub, FaSquareXTwitter, FaDiscord} from 'react-icons/fa6'
import { Link } from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'

const IconLink = ({href, Logo}: {href: string, Logo: ReactNode}) => {
  return (
    <a
      href={href}
      target="_blank"
      style={{
        padding: '0 1.25vw'
      }}>
      {Logo}
    </a>
  )
}



export const NavBar = () => {
  const [homeHover, setHomeHover] = useState(false)
  return (
    <div
      className="flex-wrap-center"
      style={{
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <Link className="button" to="/">
        <img 
          onMouseEnter={() => setHomeHover(true)}
          onMouseLeave={() => setHomeHover(false)}
          src={homeHover ? HashchanLogo : HashchanLogoGif}/></Link>
      <div
        className="flex-wrap-center"
        style={{
          padding: '0 1.25vw',
          paddingBottom: '1.25vh'
        }}>
        [<Link to="/boards/pol/catalogue">pol</Link>,&nbsp;
        <Link to="/boards/biz/catalogue">biz</Link>,&nbsp;
        <Link to="/boards/g/catalogue">g</Link>,&nbsp;
        <Link to="/boards/sci/catalogue">sci</Link>,&nbsp;
        <Link to="/boards/x/catalogue">x</Link>]
      </div>
      <ConnectWallet />
      <div
        className="flex-wrap-center"
        style={{
         justifyContent: 'space-between', 
        }}
      >
        <IconLink href="https://github.com/hashchan/hashchan" Logo={<FaGithub size="31.25px"/>} />
        <IconLink href="https://twitter.com/0xhashchan" Logo={<FaSquareXTwitter size="31.25px" />} />
        <IconLink href="https://discord.gg/ZQPA5MQHa6" Logo={<FaDiscord size="31.25px" />} />
      </div>
    </div>
  )
}
