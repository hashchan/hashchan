import './Root.css'
import { Link, Outlet } from 'react-router-dom'
export const Root = () => {
  return (
    <>
      <h1>Hash Chan</h1>
      <p>[
      <Link to="/boards/pol">pol</Link>,&nbsp;
      <Link to="/boards/x">x</Link>,&nbsp; 
      <Link to="/boards/sci">sci</Link>&nbsp;]
      </p>
      <Outlet />
    </>
  )
}

