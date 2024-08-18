import { useState } from 'react'
import HashchanLogo from '@/assets/logo-4.png'
import HashchanLogoGif from '@/assets/animated-banner.gif'
import Github from '@/assets/emoji/github.png'
import { Link } from 'react-router-dom'
import { ConnectWallet } from './ConnectWallet'

export const NavBar = () => {
  const [homeHover, setHomeHover] = useState(false)
  return (
    <div
      className="flex-wrap-center"
      style={{
        justifyContent: 'space-between',
      }}>
      <Link className="button" to="/">
        <img 
          onMouseEnter={() => setHomeHover(true)}
          onMouseLeave={() => setHomeHover(false)}
          src={homeHover ? HashchanLogo : HashchanLogoGif}/></Link>
      <div
        className="flex-wrap-center"
        style={{
          padding: '0 1.25vw'
        }}>
        [<Link to="/boards/pol/catalogue">pol</Link>,&nbsp;
        <Link to="/boards/biz/catalogue">biz</Link>,&nbsp;
        <Link to="/boards/g/catalogue">g</Link>,&nbsp;
        <Link to="/boards/sci/catalogue">sci</Link>,&nbsp;
        <Link to="/boards/x/catalogue">x</Link>]
      </div>
      <ConnectWallet />
      <a
        className="flex-wrap-center"
        style={{
          padding: '1.25vh 0'
        }}
        target="_blank"
        href="https://github.com/hashchan"
      ><img style={{height: '31.25px' }}src={Github} /></a>
    </div>
  )
}
