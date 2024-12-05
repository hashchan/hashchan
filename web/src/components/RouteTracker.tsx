import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageView } from '../utils/gtm'

export const RouteTracker = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageView(location.pathname)
  }, [location])

  return null
}
