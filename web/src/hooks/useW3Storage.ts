import { useEffect, useState, useContext, useCallback } from 'react'
import { W3UpContext
 } from '@/provider/W3UpProvider'

export const useW3Storage = () => {
  const {
   emailWaiting,
   client,
   account,
   space,
   handleLogin,
   uploadFile
  } = useContext(W3UpContext)

  const loginUser = useCallback(async (
    email: `${string}@${string}`
  ) => {
    try {
      await handleLogin(email)
    } catch (e) {
      console.log(e)
    }
  }, [handleLogin])

  return {
    emailWaiting,
    client,
    account,
    space,
    loginUser,
    uploadFile
  }
}
