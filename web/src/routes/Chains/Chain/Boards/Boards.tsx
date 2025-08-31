import { Table, TableHeader, TableData } from "@/components/Table"
import { useBoards } from "@/hooks/HashChan/useBoards"
import { FaRegCheckCircle, FaCheckCircle } from "react-icons/fa"
import { Link } from "react-router-dom"
const Favourited = ({
    board,
    toggleFavourite
}:{
    board:any,
    toggleFavourite: (board: any) => void
}) => {
    
    return (
        <span onClick={() => toggleFavourite(board)}> 
            {board.favourite === 1 ? <FaCheckCircle /> : <FaRegCheckCircle />}
        </span>
    )
}

const BoardLink = ({board}: {board: any}) => {
    return (
        <Link to={`/chains/${board.chainId}/boards/${board.boardId}`}>
            {board.name}
        </Link>
    )
}

export const Boards = ({}:{}) => {

    const {boards, toggleFavourite} = useBoards()

    return (
        <>
        <Table>
            <thead>
                <tr>
                    <TableHeader title="Favourited" />
                    <TableHeader title="Symbol"/>
                    <TableHeader title="Board"/>
                    <TableHeader title="Thread Count"/>
                    <TableHeader title="Post Count"/>
                </tr>
            </thead>
            <tbody>
                {boards.map((board, i) => (
                    <tr key={i}>
                        <TableData content={
                            <Favourited board={board} toggleFavourite={toggleFavourite}/>
                        }/>
                        <TableData content={`/${board.symbol}/`}/>
                        <TableData content={<BoardLink board={board}/>}/>
                        <TableData content={board.metadata?.stats?.threadCount}/>
                        <TableData content={board.metadata?.stats?.postCount}/>
                    </tr>
                ))}
            </tbody>
        </Table>
        </>
    )
}