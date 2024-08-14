import { Link, Outlet, useParams } from 'react-router-dom'
import { ConnectWallet } from './components/ConnectWallet'
import { About } from "@/components/About"
import HashchanLogo from '@/assets/logo-3.png'
import Github from '@/assets/emoji/github.png'
export const Root = () => {
  const { thread, board } = useParams()
  return (
    <>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        }}>
        <Link className="button" to="/"><img src={HashchanLogo}/></Link>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
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
          style={{
            display:"flex",
            alignItems: "center",
            padding: '1.25vh 0'
          }}
          target="_blank"
          href="https://github.com/hashchan"
        ><img style={{height: '31.25px' }}src={Github} /></a>
      </div>
      {(!board && !thread) ? (
        <About />
      ):(
        <Outlet />
      )}
    </>
  )
}

