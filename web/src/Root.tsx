import { Link, Outlet, useParams } from 'react-router-dom'
import { ConnectWallet } from './components/ConnectWallet'
import { About } from "@/components/About"
import HashchanLogo from '@/assets/logo-2.png'
export const Root = () => {
  const { thread, board } = useParams()
  return (
    <>
      <div style={{display: 'flex', flexWrap: 'wrap'}}>
        [<Link to="/boards/pol">pol</Link>,&nbsp;
        <Link to="/boards/biz">biz</Link>,&nbsp;
        <Link to="/boards/g">g</Link>,&nbsp;
        <Link to="/boards/sci">sci</Link>,&nbsp;
        <Link to="/boards/x">x</Link>]
      </div>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center'
        }}>
        <h1><Link to="/"><img src={HashchanLogo}/></Link></h1>
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

