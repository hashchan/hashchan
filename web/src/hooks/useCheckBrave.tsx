import {
  useEffect,
  useState,
  useCallback
} from 'react'


export const useCheckBrave = () => {
  const [isBrave, setIsBrave] = useState(false)

  const fetchCheckBrave = useCallback(async () => {
    const brave = window.navigator.brave
    if (typeof brave === 'undefined') {
      setIsBrave(false)
    } else {
      setIsBrave(await window.navigator.brave.isBrave())
    }
  },[])

  useEffect(() => {
    fetchCheckBrave()
  }, [])

  return {
    isBrave
  }

}
