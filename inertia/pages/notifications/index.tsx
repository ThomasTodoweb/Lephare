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
      return <Target className="w-4.5 h-4.5 text-text" />
    case 'mission_completed':
      return <Check className="w-4.5 h-4.5 text-success" />
    case 'streak_milestone':
      return <Flame className="w-4.5 h-4.5 text-streak" />
    case 'badge_earned':
      return <Trophy className="w-4.5 h-4.5 text-xp" />
    case 'level_up':
      return <TrendingUp className="w-4.5 h-4.5 text-level" />
    case 'weekly_summary':
      return <Gift className="w-4.5 h-4.5 text-info" />
    default:
      return <Info className="w-4.5 h-4.5 text-text-muted" />
  }
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "A l'instant"
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

      <div className="py-4 animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-bg-card border border-border active:scale-[0.97] transition-transform"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-text" />
            </Link>
            <h1 className="text-[17px] font-bold text-text tracking-tight">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-[11px] font-semibold bg-text text-white rounded-lg">
                  {unreadCount}
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllAsRead}
            >
              Tout lire
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          /* Empty state */
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 bg-bg-subtle rounded-2xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-text-muted" />
            </div>
            <h2 className="text-[15px] font-semibold text-text mb-1">
              Aucune notification
            </h2>
            <p className="text-[13px] text-text-muted max-w-xs mx-auto leading-relaxed">
              Tes notifications apparaitront ici quand tu en recevras.
            </p>
            <Link href="/missions" className="block mt-6">
              <Button variant="secondary">Voir mes missions</Button>
            </Link>
          </div>
        ) : (
          /* Notifications list */
          <div className="space-y-2.5">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                padding="sm"
                className={`${
                  notification.isRead ? '' : 'bg-bg-subtle'
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-[13px] font-semibold ${notification.isRead ? 'text-text-secondary' : 'text-text'}`}>
                        {notification.title}
                      </h3>
                      <span className="text-[11px] text-text-muted whitespace-nowrap">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <p className={`text-[13px] mt-0.5 leading-relaxed ${notification.isRead ? 'text-text-muted' : 'text-text-secondary'}`}>
                      {notification.body}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={loadingIds.has(notification.id)}
                          className="text-[12px] font-medium text-text flex items-center gap-1 min-h-[44px] active:scale-[0.97] transition-transform disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" />
                          Marquer comme lue
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        disabled={loadingIds.has(notification.id)}
                        className="text-[12px] text-text-muted flex items-center gap-1 ml-auto min-h-[44px] active:scale-[0.97] transition-transform disabled:opacity-50"
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
