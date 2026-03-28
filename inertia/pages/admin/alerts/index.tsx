import { Head, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { Moon, HeartCrack, Clock, PartyPopper } from 'lucide-react'

interface AlertTarget {
  id: number
  fullName: string | null
  email: string
  lastActivity: string | null
  daysInactive: number
  streakLost: boolean
  missionsCompleted: number
  alertType: 'inactive' | 'streak_lost' | 'trial_ending' | 'subscription_expired'
}

interface AlertStats {
  inactiveUsers: number
  streakLostUsers: number
  trialEndingUsers: number
}

interface Props {
  stats: AlertStats
  targets: AlertTarget[]
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Jamais'
  const now = new Date()
  const date = new Date(timestamp)
  const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return `Il y a ${days} jours`
}

function AlertTypeBadge({ type }: { type: AlertTarget['alertType'] }) {
  const styles: Record<string, { bg: string; text: string; label: string }> = {
    inactive: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Inactif' },
    streak_lost: { bg: 'bg-red-50', text: 'text-red-700', label: 'Streak perdu' },
    trial_ending: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Trial expirant' },
    subscription_expired: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Abo expiré' },
  }

  const style = styles[type] || styles.inactive

  return (
    <span className={`px-2.5 py-1 text-[11px] font-medium rounded-full ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  )
}

export default function AdminAlertsIndex({ stats, targets }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const selectAll = () => {
    if (selectedIds.length === targets.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(targets.map((t) => t.id))
    }
  }

  const sendAlert = (userId: number, alertType: string) => {
    setSending(true)
    router.post(
      '/admin/alerts/send',
      { userId, alertType },
      {
        preserveState: true,
        onFinish: () => setSending(false),
      }
    )
  }

  const sendBulkAlerts = () => {
    if (selectedIds.length === 0) return

    setSending(true)
    router.post(
      '/admin/alerts/send-bulk',
      { userIds: selectedIds, alertType: 'inactive' },
      {
        preserveState: true,
        onSuccess: () => setSelectedIds([]),
        onFinish: () => setSending(false),
      }
    )
  }

  return (
    <AdminLayout title="Alertes & Relances">
      <Head title="Alertes - Admin Le Phare" />

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-4" padding="lg">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Moon size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-neutral-900">{stats.inactiveUsers}</p>
            <p className="text-[13px] text-neutral-500">Utilisateurs inactifs (+7j)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4" padding="lg">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <HeartCrack size={22} className="text-red-600" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-neutral-900">{stats.streakLostUsers}</p>
            <p className="text-[13px] text-neutral-500">Streaks perdus</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4" padding="lg">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Clock size={22} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[22px] font-bold text-neutral-900">{stats.trialEndingUsers}</p>
            <p className="text-[13px] text-neutral-500">Trials expirant bientôt</p>
          </div>
        </Card>
      </div>

      {/* Bulk actions */}
      {targets.length > 0 && (
        <div className="flex items-center justify-between mb-4 p-3 bg-neutral-50 rounded-lg">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedIds.length === targets.length}
              onChange={selectAll}
              className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-neutral-600">
              {selectedIds.length > 0
                ? `${selectedIds.length} sélectionné(s)`
                : 'Tout sélectionner'}
            </span>
          </div>
          {selectedIds.length > 0 && (
            <Button onClick={sendBulkAlerts} disabled={sending}>
              {sending ? 'Envoi...' : `Envoyer relance (${selectedIds.length})`}
            </Button>
          )}
        </div>
      )}

      {/* Targets list */}
      <Card>
        <h2 className="font-bold text-lg text-neutral-900 mb-4">Utilisateurs à relancer</h2>

        {targets.length > 0 ? (
          <div className="space-y-3">
            {targets.map((target) => (
              <div
                key={target.id}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(target.id)}
                  onChange={() => toggleSelect(target.id)}
                  className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-neutral-900">
                      {target.fullName || 'Sans nom'}
                    </p>
                    <AlertTypeBadge type={target.alertType} />
                  </div>
                  <p className="text-sm text-neutral-500">{target.email}</p>
                </div>

                <div className="text-center text-sm">
                  <p className="font-bold text-neutral-900">{target.daysInactive}j</p>
                  <p className="text-xs text-neutral-500">inactif</p>
                </div>

                <div className="text-center text-sm">
                  <p className="font-bold text-neutral-900">{target.missionsCompleted}</p>
                  <p className="text-xs text-neutral-500">missions</p>
                </div>

                <Button
                  variant="secondary"
                  className="text-sm"
                  onClick={() => sendAlert(target.id, target.alertType)}
                  disabled={sending}
                >
                  Relancer
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
              <PartyPopper size={24} className="text-emerald-500" />
            </div>
            <p className="text-[13px] text-neutral-900 font-medium mb-1">Aucun utilisateur à relancer</p>
            <p className="text-[12px] text-neutral-500">
              Tous vos utilisateurs sont actifs !
            </p>
          </div>
        )}
      </Card>
    </AdminLayout>
  )
}
