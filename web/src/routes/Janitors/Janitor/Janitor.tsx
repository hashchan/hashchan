import {
  useEffect,
  useState,
  useContext
} from 'react'

import {
  useParams
} from 'react-router-dom'

import { 
  useModerationService,
} from '@/hooks/ModerationService/useModerationService'

import { MdOutlineThumbsUpDown  } from "react-icons/md";
import { FaEthereum  } from "react-icons/fa";

import { Table, TableHeader, TableData } from '@/components/Table'
import { truncateEthAddress } from '@/utils/address'
import { useAccount } from 'wagmi'
import { SetURLModerationService } from '@/components/ModerationService/SetURLModerationService'
import { AddJanitorModerationService } from '@/components/ModerationService/AddJanitorModerationService'
import { JoinModerationService } from '@/components/ModerationService/JoinModerationService'
import { TransferOwnershipModerationService } from '@/components/ModerationService/TransferOwnershipModerationService'
export const Janitor = () => {
  const {address, chain} = useAccount()
  const { janitorAddress } = useParams()
  const { 
    moderationService: ms
  } = useModerationService({address: janitorAddress as `0x${string}`})

  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Janitor Service Details</h2>
        <div style={{overflowX: 'auto'}}>
          <Table>
            <thead>
              <tr>
                <TableHeader title={"Name"}/>
                <TableHeader title={<MdOutlineThumbsUpDown />}/>
                <TableHeader title={<FaEthereum />}/>
                <TableHeader title={"Owner"}/>
                <TableHeader title={"url"}/>
                <TableHeader title={"Actions"}/>
              </tr>
            </thead>
            <tbody>
              {ms &&(
                <tr>
                  <TableData content={ms.name} />
                  <TableData content={`${ms.positives}/${ms.negatives}`} />
                  <TableData content={""}/>
                  <TableData content={truncateEthAddress(ms.owner)} />
                  <TableData content={`${ms.uri}:${ms.port}`} />
                <TableData content={<>
                  { address === ms.owner && (<SetURLModerationService instance={ms.instance} />)}
                  { address === ms.owner && (<AddJanitorModerationService instance={ms.instance} />)}
                  { address === ms.owner && (<TransferOwnershipModerationService instance={ms.instance} />)}
                  <JoinModerationService ms={ms} />
                </>} />
                </tr>
              )}
            </tbody>
          </Table>
        </div>
        <h2>Janitors</h2>
        <div style={{overflowX: 'auto'}}>
          <Table>
            <thead>
              <tr>
                <TableHeader title={"Address"}/>
                <TableHeader title={<MdOutlineThumbsUpDown />}/>
                <TableHeader title={<FaEthereum />}/>
                <TableHeader title={"Joined"} />
              </tr>
            </thead>
            <tbody>
              { ms && ms.janitors.map((j, i) => {
                console.log('j', j)
                return(
                  <tr key={i}>
                    <TableData content={truncateEthAddress(j.janitor)} />
                    <TableData content={`${j.positiveReviews}/${j.negativeReviews}`} />
                    <TableData content={Number(j.claimedWages)}/>
                    <TableData content={new Date(Number(j.started) * 1000).toLocaleString()} />
                  </tr>
                )
              })}
            </tbody>
          </Table>
        </div>
      </div>
    </>
  )
}

