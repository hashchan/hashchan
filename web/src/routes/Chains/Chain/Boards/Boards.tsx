import { Table, TableHeader, TableData } from "@/components/Table"
import { useBoards } from "@/hooks/HashChan/useBoards"
export const Boards = ({}:{}) => {

    const {boards} = useBoards()

    return (
        <>
        <Table>
            <thead>
                <tr>
                    <TableHeader title="Symbol"/>
                    <TableHeader title="Board"/>
                    <TableHeader title="Favourited" />
                </tr>
            </thead>
            <tbody>
                {boards.map((board, i) => (
                    <tr key={i}>
                        <TableData content={board.symbol}/>
                        <TableData content={board.name}/>
                        <TableData content={board.favourite}/>
                    </tr>
                ))}
            </tbody>
        </Table>
        </>
    )
}