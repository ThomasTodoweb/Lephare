import { useState, useEffect, useCallback } from 'react'

interface PushNotificationState {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  error: string | null
  reminderTime: string
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  const xsrfToken = getXsrfToken()
  if (xsrfToken) {
    headers['X-XSRF-TOKEN'] = xsrfToken
  }
  return headers
}

export function usePushNotifications(initialReminderTime: string = '10:00') {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    isLoading: true,
    error: null,
    reminderTime: initialReminderTime,
  })

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window

      if (!supported) {
        setState((prev) => ({
          ...prev,
          isSupported: false,
          isLoading: false,
        }))
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        setState((prev) => ({
          ...prev,
          isSupported: true,
          isSubscribed: !!subscription,
          isLoading: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSupported: true,
          isLoading: false,
          error: 'Erreur lors de la vérification des notifications',
        }))
      }
    }

    checkSupport()
  }, [])

  // Subscribe to push notifications
  const subscribe = useCallback(
    async (reminderTime?: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        // Request notification permission
        const permission = await Notification.requestPermission()

        if (permission !== 'granted') {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Permission de notification refusée',
          }))
          return false
        }

        // Get VAPID public key from server
        const keyResponse = await fetch('/notifications/public-key')

        if (!keyResponse.ok) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Erreur lors de la récupération de la clé publique',
          }))
          return false
        }

        const { publicKey } = await keyResponse.json()

        if (!publicKey) {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: 'Service de notifications non configuré',
          }))
          return false
        }

        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })

        // Send subscription to server
        const subscribeResponse = await fetch('/notifications/subscribe', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            reminderTime: reminderTime || state.reminderTime,
          }),
        })

        if (!subscribeResponse.ok) {
          throw new Error('Erreur lors de l\'inscription aux notifications')
        }

        setState((prev) => ({
          ...prev,
          isSubscribed: true,
          isLoading: false,
          reminderTime: reminderTime || prev.reminderTime,
        }))

        return true
      } catch (error) {
        console.error('Push subscription error:', error)
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        }))
        return false
      }
    },
    [state.reminderTime]
  )

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe on server
        await fetch('/notifications/unsubscribe', {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            endpoint: subscription.endpoint,
          }),
        })

        // Unsubscribe locally
        await subscription.unsubscribe()
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }))

      return true
    } catch (error) {
      console.error('Push unsubscribe error:', error)
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la désinscription',
      }))
      return false
    }
  }, [])

  // Update reminder time
  const updateReminderTime = useCallback(async (newTime: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      const response = await fetch('/notifications/settings', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          reminderTime: newTime,
        }),
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour')
      }

      setState((prev) => ({
        ...prev,
        reminderTime: newTime,
        isLoading: false,
      }))

      return true
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Erreur lors de la mise à jour',
      }))
      return false
    }
  }, [])

  return {
    ...state,
    subscribe,
    unsubscribe,
    updateReminderTime,
  }
}
