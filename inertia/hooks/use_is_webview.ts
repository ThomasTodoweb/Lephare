import { useState, useEffect } from 'react'

interface WebViewState {
  isWebView: boolean
  isPWA: boolean
}

/**
 * Detects if running in a WebView (in-app browser or PWA standalone mode)
 * where Instagram OAuth may not work properly
 */
export function useIsWebView(): WebViewState {
  const [isWebView, setIsWebView] = useState(false)
  const [isPWA, setIsPWA] = useState(false)

  useEffect(() => {
    // Check if running in PWA standalone mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    setIsPWA(mediaQuery.matches || (window.navigator as any).standalone === true)

    // Check for common WebView indicators
    const ua = navigator.userAgent.toLowerCase()
    const isInAppBrowser =
      // Instagram in-app browser
      ua.includes('instagram') ||
      // Facebook in-app browser
      ua.includes('fban') ||
      ua.includes('fbav') ||
      // Twitter/X in-app browser
      ua.includes('twitter') ||
      // TikTok in-app browser
      ua.includes('tiktok') ||
      // Line in-app browser
      ua.includes('line') ||
      // LinkedIn in-app browser
      ua.includes('linkedin') ||
      // Snapchat in-app browser
      ua.includes('snapchat') ||
      // Generic WebView indicators
      ua.includes('wv') ||
      (ua.includes('android') && ua.includes('; wv)'))

    setIsWebView(isInAppBrowser || mediaQuery.matches)
  }, [])

  return { isWebView, isPWA }
}
