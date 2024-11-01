import { useState, useEffect, createContext, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Signer from '@ucanto/principal/ed25519'
import * as Client from '@web3-storage/w3up-client'
import { StoreMemory } from '@web3-storage/w3up-client/stores/memory'
import { Space } from '@web3-storage/capabilities/types'
interface W3UpContextType {
  emailWaiting: boolean
  principal: Signer.Principal
  store: StoreMemory
  client: Client.Client
  account: typeof Client.Account
  space: Space
  handleLogin: (privateKey: string, email: `${string}@${string}`) => Promise<void>
  uploadFile: (file: File) => Promise<void>
}
export const W3UpContext = createContext({
  emailWaiting: false,
  principal: null,
  store: null,
  client: null,
  account: null,
  space: null,
  handleLogin: async (privateKey:string, email: `${string}@${string}`) => {},
  uploadFile: async (file: File) => {},

})

// write a context provider
export const W3UpProvider = ({children}: {children: ReactNode| ReactNode[]}) => {
  const [emailWaiting, setEmailWaiting] = useState(false)
  const [principal, setPrinciple] = useState<Signer.Principal>()
  const [store, setStore] = useState<StoreMemory>()
  const [client, setClient] = useState<Client.Client>()
  const [account, setAccount] = useState<typeof Client.Account>()
  const [space, setSpace] = useState<Space>()

  const handleLogin = async (privateKey:string, email: `${string}@${string}`) => {
    const prin = Signer.parse(privateKey)
    console.log(prin)
    const sto = new StoreMemory()
    console.log(sto)
    const cli = await Client.create({principal: prin, store: sto})
    console.log(cli)
    setEmailWaiting(true)
    const acc = await cli.login(email)

    console.log(acc)
    await acc.plan.wait()
    setEmailWaiting(false)

    const spa = await cli.createSpace(`hashchan`, {account: acc})
    console.log(spa)

    setPrinciple(prin)
    setStore(sto)
    setClient(cli)
    setAccount(acc)
    setSpace(spa)
  }

  const uploadFile = async (file: File) => {
    console.log(file)
  }
  return (
    <W3UpContext.Provider value={{
      emailWaiting,
      principal,
      store,
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
