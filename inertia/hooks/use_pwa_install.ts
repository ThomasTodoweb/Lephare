import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check iOS standalone
    if ((navigator as any).standalone === true) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
      }

      setDeferredPrompt(null)
      return outcome === 'accepted'
    } catch (error) {
      console.error('PWA install error:', error)
      return false
    }
  }

  // Detect browser and platform
  const userAgent = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream
  const isSafari = /Safari/.test(userAgent) && !/Chrome|CriOS|FxiOS/.test(userAgent)
  const isChrome = /CriOS/.test(userAgent) || (/Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent))
  const isIOSChrome = isIOS && /CriOS/.test(userAgent)
  const isIOSSafari = isIOS && isSafari

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isIOSChrome,
    isIOSSafari,
    isChrome,
    isSafari,
    install,
  }
}
