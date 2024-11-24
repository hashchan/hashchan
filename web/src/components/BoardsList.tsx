import { Fragment, useState, useEffect, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useBoards } from '@/hooks/useBoards'
import { useCreateBoard } from '@/hooks/useCreateBoard'
import { useAccount } from 'wagmi'
import { FaRegCheckCircle, FaCheckCircle } from 'react-icons/fa'

export const BoardsList = () => {
  const { address } =  useAccount()
  const { boards, favouriteBoards, toggleFavourite } = useBoards()
  const { createBoard } = useCreateBoard()
  const [expandBoardList, setExpandBoardList] = useState(false)

  if (address) {
    return (
      <>[
        {favouriteBoards.map((board,i) => {
          return (
            <Fragment key={i}>
              <Link
                to={`/boards/${board.symbol}/catalogue`}
              >
                {board.symbol}
              </Link>,&nbsp;
            </Fragment>
          )
        })}
        ]
        <button
          onClick={() => setExpandBoardList(old => !old)}
        >+ ▿</button>
        {expandBoardList && (
          <div style={{
            backgroundColor: '#090909',
            display: 'block',
            position: 'absolute',
            top: `${(100/ Math.PHI) + (100/ Math.PHI**3)}px`,
            zIndex: '1',
            width: `${100*Math.PHI}px`,
            }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              }}>
              {boards.map((board,i) => {
                return (
                  <div
                    key={i}
                    style={{
                      padding:'0px 5px',
                      borderBottom: '1px solid #20C20E',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}>
                    <Link
                      to={`/boards/${board.symbol}/catalogue`}
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
              })}{/*
              <button
                onClick={() => createBoard('My Board', 'MB')}
              >+</button>
              */}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>{}
    </>
  )
}
