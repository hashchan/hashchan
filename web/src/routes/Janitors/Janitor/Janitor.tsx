import {
  useEffect,
  useState,
  useContext
} from 'react'

import { 
  useModerationServices,
} from '@/hooks/ModerationService/useModerationServices'


export const Janitor = () => {

  return (
    <>
      <div
        className="flex-wrap-center"
        style={{
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Janitor Details</h2>
      </div>
    </>
  )
}

