import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''
const isProduction = import.meta.env.VITE_ENV === 'production'
let isInitialized = false

export const initializeGA = () => {
  console.log('isProduction', isProduction, 'GA_MEASUREMENT_ID', GA_MEASUREMENT_ID, 'isInitialized', isInitialized)
  if (isProduction && GA_MEASUREMENT_ID && !isInitialized) {
    ReactGA.initialize(GA_MEASUREMENT_ID)
    isInitialized = true
  }
}

// Helper function to track page views
export const trackPageView = (path: string) => {
  if (isProduction && GA_MEASUREMENT_ID && isInitialized) {
    ReactGA.send({ hitType: "pageview", page: path });
  }
}

// Helper function to track events
export const trackEvent = (category: string, action: string, label?: string) => {
  if (isProduction && GA_MEASUREMENT_ID && isInitialized) {
    ReactGA.event({
      category,
      action,
      label
    });
  }
}
