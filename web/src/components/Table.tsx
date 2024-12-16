import { ReactNode } from 'react'

export const TableHeader = ({title}:{title:string}) => {

  return (
    <th style={{
      padding: '13px 21px',
      textAlign: 'left',
      fontWeight: Math.PHI*100,
      color: '#df3df1',
      textTransform: 'uppercase',
      borderBottom: '1px solid #20c20E'
      }}>{title}</th>
  )
}

export const TableData = ({content}:{content:string | ReactNode}) => {
  return (
    <td style={{
      padding: '13px 21px',
      whiteSpace: 'nowrap',
      }}>{content}</td>
  )
}

export const Table = ({children}:{children:ReactNode}) => {
  return (
      <table style={{ 
        minWidth: `${(100/Math.PHI)+(100/(Math.PHI**3))+(100/(Math.PHI**5))}vw`, 
        margin: '0 auto',
        border: '1px solid #20c20E'
        }}>
        {children}
      </table>
  )
}
