import { ReactNode } from 'react'

import { CreateModerationService } from '@/components/ModerationService/CreateModerationService'
import { SetURLModerationService } from '@/components/ModerationService/SetURLModerationService'
import { AddJanitorModerationService } from '@/components/ModerationService/AddJanitorModerationService'
import { JoinModerationService } from '@/components/ModerationService/JoinModerationService'
import { TransferOwnershipModerationService } from '@/components/ModerationService/TransferOwnershipModerationService'
import { useAccount } from 'wagmi'
import { useModerationServices } from '@/hooks/ModerationService/useModerationServices'
import { truncateEthAddress } from '@/utils/address'
import { Table, TableHeader, TableData } from '@/components/Table'

const ModServiceTable = () => {
  const { moderationServices } = useModerationServices()
  const { address } = useAccount()

  return (
    <div style={{ overflowX: 'auto' }}>
      <Table>
        <thead>
          <tr>
            <TableHeader title="Name" />
            <TableHeader title="Address" />
            <TableHeader title="Owner" />
            <TableHeader title="URL" />
            <TableHeader title="Actions" />
          </tr>
        </thead>
        <tbody>
          {moderationServices.length > 0 && moderationServices.map((ms, i) => (
            <tr key={i} style={{ 
              borderBottom: '1px solid #20c20E'
            }}>
              <TableData content={ms.name} />
              <TableData content={truncateEthAddress(ms.address)} />
              <TableData content={truncateEthAddress(ms.owner)} />
              <TableData content={`${ms.uri}/${ms.port}`} />
                <TableData content={<>
                  { address === ms.owner && (<SetURLModerationService instance={ms.instance} />)}
                  { address === ms.owner && (<AddJanitorModerationService instance={ms.instance} />)}
                  { address === ms.owner && (<TransferOwnershipModerationService instance={ms.instance} />)}
                  <JoinModerationService ms={ms} />
                </>} />
            </tr>
          ))}
        </tbody>
      </Table>
      {moderationServices.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '21px 0',
          color: '#20c20E'
        }}>
          No moderation services found
        </div>
      )}
    </div>
  )
}


export const Janitors = () => {
  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Janitors Portal</h2>
        <CreateModerationService />
      </div>
      <ModServiceTable />
    </>
  )
}
