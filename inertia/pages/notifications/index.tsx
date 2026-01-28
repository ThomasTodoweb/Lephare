import { Head, Link, router } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { Bell, ArrowLeft, Check, CheckCheck, Trash2, Target, Trophy, Flame, Gift, TrendingUp, Info } from 'lucide-react'
import { useState } from 'react'

interface Notification {
  id: number
  title: string
  body: string
  type: string
  data: Record<string, unknown> | null
  isRead: boolean
  createdAt: string
}

interface Props {
  notifications: Notification[]
  unreadCount: number
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'mission_reminder':
      return <Target className="w-5 h-5 text-primary" />
    case 'mission_completed':
      return <Check className="w-5 h-5 text-green-600" />
    case 'streak_milestone':
      return <Flame className="w-5 h-5 text-orange-500" />
    case 'badge_earned':
      return <Trophy className="w-5 h-5 text-yellow-500" />
    case 'level_up':
      return <TrendingUp className="w-5 h-5 text-purple-500" />
    case 'weekly_summary':
      return <Gift className="w-5 h-5 text-blue-500" />
    default:
      return <Info className="w-5 h-5 text-neutral-500" />
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
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export default function Notifications({ notifications, unreadCount }: Props) {
  const [loadingIds, setLoadingIds] = useState<Set<number>>(new Set())

  const handleMarkAsRead = (id: number) => {
    setLoadingIds((prev) => new Set(prev).add(id))
    router.post(`/notifications/${id}/read`, {}, {
      preserveScroll: true,
      onFinish: () => {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      },
    })
  }

  const handleMarkAllAsRead = () => {
    router.post('/notifications/read-all', {}, {
      preserveScroll: true,
    })
  }

  const handleDelete = (id: number) => {
    setLoadingIds((prev) => new Set(prev).add(id))
    router.delete(`/notifications/${id}`, {
      preserveScroll: true,
      onFinish: () => {
        setLoadingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      },
    })
  }

  return (
    <AppLayout>
      <Head title="Notifications" />

      <div className="py-4">
        {/* Header with back button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </Link>
            <h1 className="text-xl font-bold text-neutral-900">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-0.5 text-sm bg-primary text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-sm text-primary"
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              Tout lire
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          /* Empty state */
          <Card className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-900 mb-2">
              Aucune notification
            </h2>
            <p className="text-neutral-600 text-sm max-w-xs mx-auto">
              Tu n'as pas encore de notifications. Elles apparaitront ici quand tu en recevras !
            </p>
          </Card>
        ) : (
          /* Notifications list */
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${
                  notification.isRead ? 'bg-white' : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-semibold text-sm ${notification.isRead ? 'text-neutral-700' : 'text-neutral-900'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-xs text-neutral-400 whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${notification.isRead ? 'text-neutral-500' : 'text-neutral-600'}`}>
                      {notification.body}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={loadingIds.has(notification.id)}
                          className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Marquer comme lue
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={loadingIds.has(notification.id)}
                        className="text-xs text-neutral-400 hover:text-red-500 flex items-center gap-1 ml-auto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
