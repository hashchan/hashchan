import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { useBoards } from '@/hooks/HashChan/useBoards'
import { useAccount } from 'wagmi'
import { FaRegCheckCircle, FaCheckCircle } from 'react-icons/fa'
import { CreateBoard } from '@/components/HashChan/CreateBoard'
import { DropDown } from '@/components/DropDown'

const BoardItem = ({
  board,
  toggleFavourite
}:{
  board: any
  toggleFavourite: (board: any) => void
}) => {
  const [hover, setHover] = useState(false)

  const handleMouseEnter = () => {
    setHover(true)
  }

  const handleMouseLeave = () => {
    setHover(false)
  }

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        width: `${100*Math.PHI}px`,
        margin: '5px 8px',
        backgroundColor: hover ? '#222222' : '#090909',
        padding:'5px 8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
      <Link
        to={`/chains/${board.chainId}/boards/${board.boardId}/catalogue`}
        style={{
        }}
      >
        {board.symbol}
      </Link>
      <button
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onClick={() => {toggleFavourite(board)}}>
        {board.favourite === 1 ? <FaCheckCircle /> : <FaRegCheckCircle />}
      </button>
    </div>
  )
}

export const BoardsList = () => {
  const { address } =  useAccount()
  const { boards, favouriteBoards, toggleFavourite } = useBoards()
  const [openCreateBoard, setOpenCreateBoard] = useState(false)

  const handleClose = () => {
    setOpenCreateBoard(old => !old)
  }
  if (address) {
    return (
      <>[
        {favouriteBoards.map((board,i) => {
          return (
            <Fragment key={i}>
              <Link
                to={`/chains/${board.chainId}/boards/${board.boardId}/catalogue`}
              >
                {board.symbol}
              </Link>,&nbsp;
            </Fragment>
          )
        })}
        ]
        <DropDown name="Boards">
          {boards.map((board,i) => {
            return <BoardItem key={i} board={board} toggleFavourite={toggleFavourite} />
          })}
          <button
            style={{
              border: 'none',
            }}
            onClick={() => setOpenCreateBoard(old => !old)}
          >+</button>
        </DropDown>
        {openCreateBoard && (
          <CreateBoard
            handleClose={handleClose}
          />
        )}
      </>
    )
  }

  return (<Link to="/docs/v1/instructions">Instructions</Link>)
}
