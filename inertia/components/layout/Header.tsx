import { useState, useEffect } from 'react'
import { Bell, X, Target, Check, Flame, Trophy, TrendingUp, Gift, Info, Trash2 } from 'lucide-react'

interface Notification {
  id: number
  title: string
  body: string
  type: string
  data: { url?: string; missionId?: number } | null
  isRead: boolean
  createdAt: string
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'mission_reminder':
      return <Target className="w-4 h-4 text-primary" />
    case 'mission_completed':
      return <Check className="w-4 h-4 text-green-600" />
    case 'streak_milestone':
      return <Flame className="w-4 h-4 text-orange-500" />
    case 'badge_earned':
      return <Trophy className="w-4 h-4 text-yellow-500" />
    case 'level_up':
      return <TrendingUp className="w-4 h-4 text-purple-500" />
    case 'weekly_summary':
      return <Gift className="w-4 h-4 text-blue-500" />
    default:
      return <Info className="w-4 h-4 text-neutral-500" />
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `${diffMins} min`
  if (diffHours < 24) return `${diffHours}h`
  if (diffDays < 7) return `${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/notifications/list')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch notifications on mount
    fetchNotifications()
  }, [])

  useEffect(() => {
    // Refetch when modal opens
    if (isNotificationsOpen) {
      fetchNotifications()
    }
  }, [isNotificationsOpen])

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await fetch(`/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '',
        },
      })
      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] || '',
        },
      })
      if (response.ok) {
        const deletedNotif = notifications.find(n => n.id === id)
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (deletedNotif && !deletedNotif.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id)
    }

    // Close modal
    setIsNotificationsOpen(false)

    // Navigate to the appropriate page based on notification type or data
    const url = notification.data?.url || '/dashboard'
    window.location.href = url
  }

  return (
    <>
      <header className="h-20 bg-background flex items-center justify-between px-4 relative pwa-safe-area-top">
        {/* Logo left-aligned */}
        <img
          src="/logo-rectangle.png"
          alt="LE PHARE"
          className="h-12 object-contain"
        />

        {/* Notification bell - opens popup */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          className="relative w-11 h-11 flex items-center justify-center text-text rounded-full bg-neutral-50 shadow-sm hover:shadow-md transition-all duration-200 ease-out active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </header>

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsNotificationsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-xl mx-4 w-full max-w-sm animate-scale-in max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-white rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="w-14 h-14 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                    <Bell className="w-7 h-7 text-neutral-400" />
                  </div>
                  <p className="text-neutral-900 font-medium mb-1">Aucune notification</p>
                  <p className="text-neutral-500 text-sm">
                    Tu n'as pas encore de notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors ${!notification.isRead ? 'bg-primary/5' : ''}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-medium ${!notification.isRead ? 'text-neutral-900' : 'text-neutral-600'}`}>
                              {notification.title}
                            </p>
                            <span className="text-xs text-neutral-400 whitespace-nowrap">
                              {formatRelativeTime(notification.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id) }}
                                className="text-xs text-primary hover:text-primary/80"
                              >
                                Marquer lu
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }}
                              className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
