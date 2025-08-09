import {
  useEffect,
  useState,
  useCallback
} from 'react'


export const useCheckBrave = () => {
  const [isBrave, setIsBrave] = useState(false)

  const fetchCheckBrave = useCallback(async () => {

    const brave = window.navigator.brave
    console.log('brave', brave)

    if (typeof brave === 'undefined') {
      setIsBrave(false)
    } else {
      setIsBrave(true)
    }
  },[])

  useEffect(() => {
    console.log('checking brave')
    fetchCheckBrave()
  }, [])

  return {
    isBrave
  }

}
