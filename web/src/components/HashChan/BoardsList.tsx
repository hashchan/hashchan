import { Fragment, useState, useEffect, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useBoards } from '@/hooks/HashChan/useBoards'
import { useCreateBoard } from '@/hooks/HashChan/useCreateBoard'
import { useAccount } from 'wagmi'
import { FaRegCheckCircle, FaCheckCircle } from 'react-icons/fa'
import { CreateBoard } from '@/components/HashChan/CreateBoard'
import { DropDown } from '@/components/DropDown'
export const BoardsList = () => {
  const { address } =  useAccount()
  const { boards, favouriteBoards, toggleFavourite } = useBoards()
  const { createBoard } = useCreateBoard()
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
            return (
              <div
                key={i}
                style={{
                  padding:'0px 5px',
                  borderBottom: '1px solid #20C20E',
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
                    border: 'none',
                  }}
                  onClick={() => {toggleFavourite(board)}}>
                  {board.favourite === 1 ? <FaCheckCircle /> : <FaRegCheckCircle />}
                </button>
              </div>
            )
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
