import {useState, useEffect, useCallback} from 'react'
import { useAccount, useWalletClient } from 'wagmi'


export const useThread = () => {
  const { address } = useAccount()
  const walletClient = useWalletClient()
  const [posts, setPosts] = useState([])

  const fetchPosts = useCallback(async () => {
    if (!walletClient && !address) {
    } else {
    }





  }, [walletClient, address])
