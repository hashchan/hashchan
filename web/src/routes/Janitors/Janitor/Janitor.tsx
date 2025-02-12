import {
  useEffect,
  useState,
  useContext
} from 'react'

import {
  useParams
} from 'react-router-dom'
import {
  formatEther
} from 'viem'
import { 
  useModerationService,
} from '@/hooks/ModerationService/useModerationService'

import { MdOutlineThumbsUpDown  } from "react-icons/md";
import { FaEthereum  } from "react-icons/fa";

import { formatNumberWithSubscriptZeros as fmtZero  } from '@haqq/format-number-with-subscript-zeros' 

import { Table, TableHeader, TableData } from '@/components/Table'
import { truncateEthAddress } from '@/utils/address'
import { useAccount } from 'wagmi'
import { SetURLModerationService } from '@/components/ModerationService/SetURLModerationService'
import { AddJanitorModerationService } from '@/components/ModerationService/AddJanitorModerationService'
import { JoinModerationService } from '@/components/ModerationService/JoinModerationService'
import { TransferOwnershipModerationService } from '@/components/ModerationService/TransferOwnershipModerationService'

import { getExplorerUrl } from '@/utils/explorer'

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
                <TableHeader title={"Address"}/>
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
                  <TableData content={fmtZero(formatEther(ms.totalWages))}/>

                  <TableData content={
                    <a
                      target="_blank"
                      href={getExplorerUrl(chain, ms.address, 'address')}
                    >
                      {truncateEthAddress(ms.address)}
                    </a>
                  } />
                  <TableData content={
                    <a
                      target="_blank"
                      href={getExplorerUrl(chain, ms.owner, 'address')}
                    >
                      {truncateEthAddress(ms.owner)}
                    </a>
                  } />
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

                    <TableData content={
                      <a
                        target="_blank"
                        href={getExplorerUrl(chain, j.janitor, 'address')}
                      >
                        {truncateEthAddress(j.janitor)}
                      </a>
                    } />
                    <TableData content={`${j.positiveReviews}/${j.negativeReviews}`} />
                    <TableData content={fmtZero(formatEther(j.claimedWages))}/>
                    <TableData content={Number(j.started)} />
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

