import { Link, Outlet, useParams } from 'react-router-dom'
import { ConnectWallet } from './components/ConnectWallet'
import { About } from "@/components/About"
import HashchanLogo from '@/assets/logo.png'
export const Root = () => {
  const { thread, board } = useParams()
  return (
    <>
      <div style={{width: '80vw', display: 'flex', alignItems: 'center', height: '10px'}}>
        <p>[
        <Link to="/boards/pol">pol</Link>,&nbsp;
        <Link to="/boards/biz">biz</Link>,&nbsp;
        <Link to="/boards/g">g</Link>,&nbsp;
        <Link to="/boards/sci">sci</Link>,&nbsp;
        <Link to="/boards/x">x</Link>
         ]</p>
      </div>
      <div style={{width: '80vw', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <h1><Link to="/"><img src={HashchanLogo} style={{height: '162px'}} /></Link></h1>
        <ConnectWallet />
      </div>
      {(!board && !thread) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

