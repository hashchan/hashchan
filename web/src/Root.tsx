import { Link, Outlet, useParams } from 'react-router-dom'
import { ConnectWallet } from './components/ConnectWallet'
import { About } from "@/components/About"
import HashchanLogo from '@/assets/logo-3.png'
export const Root = () => {
  const { thread, board } = useParams()
  return (
    <>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25vw'
        }}>
        <Link to="/"><img src={HashchanLogo}/></Link>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.25vw'
        }}>
        [<Link to="/boards/pol">pol</Link>,&nbsp;
        <Link to="/boards/biz">biz</Link>,&nbsp;
        <Link to="/boards/g">g</Link>,&nbsp;
        <Link to="/boards/sci">sci</Link>,&nbsp;
        <Link to="/boards/x">x</Link>]
      </div>
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

