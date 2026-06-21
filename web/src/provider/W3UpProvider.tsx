import { useState, useEffect, createContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Client from '@storacha/client'
import { Space } from '@storacha/capabilities/types'

interface W3UpContextType {
  emailWaiting: boolean
  client: Client.Client
  account: typeof Client.Account
  space: Space
  handleLogin: (email: `${string}@${string}`) => Promise<void>
  uploadFile: (file: File) => Promise<void>
}
export const W3UpContext = createContext({
  emailWaiting: false,
  client: null,
  account: null,
  space: null,
  handleLogin: async (email: `${string}@${string}`) => {},
  uploadFile: async (file: File): Promise<string> => {},
})

// write a context provider
export const W3UpProvider = ({children}: {children: ReactNode| ReactNode[]}) => {
  const [emailWaiting, setEmailWaiting] = useState(false)
  const [client, setClient] = useState<Client.Client>()
  const [account, setAccount] = useState<typeof Client.Account>()
  const [space, setSpace] = useState<Space>()

  const handleLogin = async (email: `${string}@${string}`) => {
    const cli = await Client.create()
    setEmailWaiting(true)
    const acc = await cli.login(email)
    await acc.plan.wait()
    setEmailWaiting(false)

    const spa = await cli.createSpace(`hashchan`, {account: acc})
    await cli.setCurrentSpace(spa.did())
    setClient(cli)
    setAccount(acc)
    setSpace(spa)
  }

  const uploadFile = async (file: File) => {

    console.log(file)
    try {
      const res = await client.uploadFile(file[0])
      return `https://${res.toString()}.ipfs.storacha.link`
    } catch (e) {
      console.log('e', e)
      
    }
  }

  useEffect(() => {
    /*
    const w3up = JSON.parse(localStorage.getItem('w3up'))
    if (w3up) {
      handleLogin(w3up.privateKey, w3up.email)
    }
     */
  }, [])
  return (
    <W3UpContext.Provider value={{
      emailWaiting,
      client,
      account,
      space,
      handleLogin,
      uploadFile
    }}>
      {children}
    </W3UpContext.Provider>
  )
}
