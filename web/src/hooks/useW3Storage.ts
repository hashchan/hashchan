import { useEffect, useState, useContext, useCallback } from 'react'
import { W3UpContext
 } from '@/provider/W3UpProvider'

export const useW3Storage = () => {
  const {
   emailWaiting,
   principal,
   store,
   client,
   account,
   space,
   handleLogin,
   uploadFile
  } = useContext(W3UpContext)

  const loginUser = useCallback(async (
    privateKey: string,
    email: `${string}@${string}`
  ) => {
    try {
      console.log('attempting login')
      console.log(privateKey, email)
      const res = await handleLogin(privateKey, email)
      console.log(res)
    } catch (e) {
      console.log(e)
    }
  }, [handleLogin])

  return {
    emailWaiting,
    principal,
    store,
    client,
    account,
    space,
    loginUser,
    uploadFile
  }
}
