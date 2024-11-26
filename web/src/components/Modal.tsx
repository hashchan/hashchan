import {  ReactNode } from 'react'
import Draggable from 'react-draggable'

export const Modal = ({
  handleClose,
  children
}): {
  handleClose: () => void
  children: ReactNode
} => {
  return (
    <Draggable>
      <div
        className="flex-wrap-center overlay"
        style={{
          width: `${(100/(Math.PHI))+(100/(Math.PHI**3))}vw`,
        }}
      >
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'flex-end',
          }} >
          <button
            style={{
              color: 'red'
            }}
            onClick={() => handleClose()}>x</button>
        </div>
        {children}
      </div>
    </Draggable>
  )
}
