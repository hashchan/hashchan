import TagManager from 'react-gtm-module'

const GTM_ID = import.meta.env.VITE_GTM_ID || ''

export const initializeGTM = () => {
  if (import.meta.env.VITE_ENV === 'production' && GTM_ID) {
    TagManager.initialize({
      gtmId: GTM_ID
    })
  }
}
