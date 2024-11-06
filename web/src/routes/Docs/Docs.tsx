import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Outlet, Link } from "react-router-dom";

export const Docs = () => {

  return (
    <>
      <h3>Hashchan Documentation</h3>
      <p>[
        <Link to="/docs/v1/intro">Intro</Link>,&nbsp;
        <Link to="/docs/v1/instructions">Instructions</Link>
      ]</p>
      <Outlet />
    </>
  )
}
