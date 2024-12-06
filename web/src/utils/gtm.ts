import ReactGA from 'react-ga4'

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || ''
const GTM_ID = import.meta.env.VITE_GTM_ID || ''
const isProduction = import.meta.env.VITE_ENV === 'production'
let isInitialized = false

// Initialize both GA4 and GTM
export const initializeAnalytics = () => {
  if (isProduction && !isInitialized) {
    // Initialize GA4
    if (GA_MEASUREMENT_ID) {
      ReactGA.initialize(GA_MEASUREMENT_ID)
    }

    // Initialize GTM
    if (GTM_ID) {
      const script = document.createElement('script')
      script.async = true
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GTM_ID}`
      document.head.appendChild(script)

      window.dataLayer = window.dataLayer || []
      function gtag(...args: any[]) {
        window.dataLayer.push(args)
      }
      gtag('js', new Date())
      gtag('config', GTM_ID)
    }

    isInitialized = true
  }
}

// Track page views in both GA4 and GTM
export const trackPageView = (path: string) => {
  if (isProduction && isInitialized) {
    // Track in GA4
    if (GA_MEASUREMENT_ID) {
      ReactGA.send({ hitType: "pageview", page: path })
    }

    // Track in GTM
    if (GTM_ID && window.dataLayer) {
      window.dataLayer.push({
        event: 'pageview',
        page: path
      })
    }
  }
}

// Track events in both GA4 and GTM
export const trackEvent = (category: string, action: string, label?: string, value?: number) => {
  if (isProduction && isInitialized) {
    // Track in GA4
    if (GA_MEASUREMENT_ID) {
      ReactGA.event({
        category,
        action,
        label,
        value
      })
    }

    // Track in GTM
    if (GTM_ID && window.dataLayer) {
      window.dataLayer.push({
        event: 'customEvent',
        eventCategory: category,
        eventAction: action,
        eventLabel: label,
        eventValue: value
      })
    }
  }
}

// TypeScript declarations
declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}
