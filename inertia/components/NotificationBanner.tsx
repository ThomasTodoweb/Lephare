import { useState, useEffect } from 'react'
import { router } from '@inertiajs/react'
import { usePushNotifications } from '~/hooks/use_push_notifications'

interface Props {
  isConfigured: boolean
  hasSubscription: boolean
  bannerDismissed: boolean
}

export function NotificationBanner({ isConfigured, hasSubscription, bannerDismissed }: Props) {
  const [isVisible, setIsVisible] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
  } = usePushNotifications('10:00')

  // Detect PWA mode on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true

      setIsStandalone(standalone)

      // Show banner only if:
      // 1. Running as PWA (standalone mode)
      // 2. Notifications are configured on server
      // 3. User hasn't dismissed the banner
      // 4. User doesn't already have an active subscription
      // 5. Browser supports push notifications
      const shouldShow =
        standalone &&
        isConfigured &&
        !bannerDismissed &&
        !hasSubscription &&
        !isSubscribed &&
        isSupported

      setIsVisible(shouldShow)
    }
  }, [isConfigured, bannerDismissed, hasSubscription, isSubscribed, isSupported])

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Save dismissal to DB
    router.post('/dashboard/dismiss-notification-banner', {}, {
      preserveScroll: true,
      preserveState: true,
    })
  }

  // Don't render if not visible or if we're not in PWA mode
  if (!isVisible) {
    return null
  }

  return (
    <div className="bg-primary text-white rounded-xl p-4 mb-4 shadow-lg animate-slide-down">
      <div className="flex items-start gap-3">
        {/* Bell icon */}
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-sm">Activez les notifications</h3>
          <p className="text-white/90 text-xs mt-1">
            Recevez un rappel quotidien pour ne jamais oublier votre mission !
          </p>

          {error && (
            <p className="text-white/70 text-xs mt-2 bg-white/10 rounded px-2 py-1">
              {error}
            </p>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleEnable}
              disabled={isLoading}
              className="px-4 py-2 bg-white text-primary rounded-lg text-xs font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Activation...' : 'Activer'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 text-white/80 text-xs font-medium hover:text-white transition-colors"
            >
              Plus tard
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={handleDismiss}
          className="text-white/60 hover:text-white p-1"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
