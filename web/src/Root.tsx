import './Root.css'
import { Link, Outlet } from 'react-router-dom'
import { ConnectWallet } from './components/ConnectWallet'
export const Root = () => {
  return (
    <>
      <h1>Hash Chan</h1>
      <ConnectWallet />
      <p>[
      <Link to="/boards/pol">pol</Link>,&nbsp;
      <Link to="/boards/x">x</Link>,&nbsp; 
      <Link to="/boards/sci">sci</Link>&nbsp;]
      <Link to="/boards/biz">biz</Link>&nbsp;]
      </p>
      <Outlet />
    </>
  )
}

