import { Head } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card } from '~/components/ui'

interface GlobalStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalMissions: number
  completedMissions: number
  completionRate: number
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  tutorialsCompleted: number
  averageStreak: number
}

interface UserGrowth {
  date: string
  count: number
}

interface RecentActivity {
  type: 'user_joined' | 'mission_completed' | 'tutorial_completed' | 'subscription_started'
  userId: number
  userName: string
  timestamp: string
  details?: string
}

interface Props {
  globalStats: GlobalStats
  userGrowth: UserGrowth[]
  recentActivity: RecentActivity[]
}

function StatCard({
  label,
  value,
  icon,
  subValue,
  trend,
}: {
  label: string
  value: number | string
  icon: string
  subValue?: string
  trend?: 'up' | 'down' | 'neutral'
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm text-neutral-500">{label}</p>
        <p className="text-2xl font-bold text-neutral-900 mt-1">{value}</p>
        {subValue && (
          <p
            className={`text-sm mt-1 ${
              trend === 'up'
                ? 'text-green-600'
                : trend === 'down'
                  ? 'text-red-500'
                  : 'text-neutral-500'
            }`}
          >
            {subValue}
          </p>
        )}
      </div>
      <span className="text-3xl">{icon}</span>
    </Card>
  )
}

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  switch (type) {
    case 'user_joined':
      return <span className="text-blue-500">👤</span>
    case 'mission_completed':
      return <span className="text-green-500">✓</span>
    case 'tutorial_completed':
      return <span className="text-purple-500">📚</span>
    case 'subscription_started':
      return <span className="text-yellow-500">⭐</span>
    default:
      return <span>•</span>
  }
}

function ActivityLabel({ type }: { type: RecentActivity['type'] }) {
  switch (type) {
    case 'user_joined':
      return 'Nouvel utilisateur'
    case 'mission_completed':
      return 'Mission terminée'
    case 'tutorial_completed':
      return 'Tutoriel complété'
    case 'subscription_started':
      return 'Abonnement activé'
    default:
      return 'Activité'
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "À l'instant"
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
  return `Il y a ${Math.floor(seconds / 86400)}j`
}

export default function AdminDashboard({ globalStats, userGrowth, recentActivity }: Props) {
  const maxGrowth = Math.max(...userGrowth.map((g) => g.count), 1)

  return (
    <AdminLayout title="Dashboard">
      <Head title="Admin Dashboard - Le Phare" />

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Utilisateurs totaux"
          value={globalStats.totalUsers}
          icon="👥"
          subValue={`${globalStats.activeUsers} actifs`}
          trend="neutral"
        />
        <StatCard
          label="Missions complétées"
          value={globalStats.completedMissions}
          icon="✓"
          subValue={`${globalStats.completionRate}% taux de complétion`}
          trend={globalStats.completionRate > 50 ? 'up' : 'down'}
        />
        <StatCard
          label="Abonnements actifs"
          value={globalStats.activeSubscriptions}
          icon="⭐"
          subValue={`${globalStats.trialSubscriptions} en trial`}
          trend="neutral"
        />
        <StatCard
          label="Tutoriels complétés"
          value={globalStats.tutorialsCompleted}
          icon="📚"
          subValue={`Streak moyen: ${globalStats.averageStreak}j`}
          trend="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User growth chart */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">
            Croissance utilisateurs (30 jours)
          </h2>
          <div className="h-48 flex items-end gap-1">
            {userGrowth.slice(-30).map((point, index) => {
              const height = (point.count / maxGrowth) * 100
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary rounded-t hover:bg-primary/80 transition-colors cursor-pointer"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${point.date}: ${point.count} inscriptions`}
                />
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-neutral-400 mt-2">
            <span>{userGrowth[0]?.date}</span>
            <span>{userGrowth[userGrowth.length - 1]?.date}</span>
          </div>
        </Card>

        {/* Recent activity */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Activité récente</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 rounded hover:bg-neutral-50"
                >
                  <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                    <ActivityIcon type={activity.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {activity.userName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      <ActivityLabel type={activity.type} />
                      {activity.details && ` - ${activity.details}`}
                    </p>
                  </div>
                  <span className="text-xs text-neutral-400 whitespace-nowrap">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-500 py-8">Aucune activité récente</p>
            )}
          </div>
        </Card>
      </div>

      {/* Additional stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="text-center">
          <p className="text-4xl font-bold text-neutral-900">{globalStats.totalMissions}</p>
          <p className="text-sm text-neutral-500 mt-1">Missions générées</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-neutral-900">{globalStats.inactiveUsers}</p>
          <p className="text-sm text-neutral-500 mt-1">Utilisateurs inactifs (+30j)</p>
        </Card>
        <Card className="text-center">
          <p className="text-4xl font-bold text-neutral-900">{globalStats.totalSubscriptions}</p>
          <p className="text-sm text-neutral-500 mt-1">Abonnements totaux</p>
        </Card>
      </div>
    </AdminLayout>
  )
}
