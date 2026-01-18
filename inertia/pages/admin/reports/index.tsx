import { Head, router } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface PeriodStats {
  newUsers: number
  completedMissions: number
  tutorialsViewed: number
  activeSubscriptions: number
  newSubscriptions: number
  canceledSubscriptions: number
  revenue: number
}

interface DailyStats {
  date: string
  users: number
  missions: number
}

interface TopUser {
  id: number
  name: string
  email: string
  completedMissions: number
}

interface Props {
  period: '7' | '30' | '90'
  currentStats: PeriodStats
  previousStats: PeriodStats
  dailyStats: DailyStats[]
  topUsers: TopUser[]
}

function StatCard({
  label,
  value,
  previousValue,
  icon,
  prefix = '',
  suffix = '',
}: {
  label: string
  value: number
  previousValue: number
  icon: string
  prefix?: string
  suffix?: string
}) {
  const change = previousValue > 0 ? Math.round(((value - previousValue) / previousValue) * 100) : 0
  const isPositive = change >= 0

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">
            {prefix}{value.toLocaleString()}{suffix}
          </p>
          <p
            className={`text-sm mt-1 ${
              isPositive ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {isPositive ? '+' : ''}{change}% vs période précédente
          </p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </Card>
  )
}

export default function AdminReportsIndex({
  period,
  currentStats,
  previousStats,
  dailyStats,
  topUsers,
}: Props) {
  const handlePeriodChange = (newPeriod: string) => {
    router.get('/admin/reports', { period: newPeriod }, { preserveState: true })
  }

  const handleExport = () => {
    window.location.href = `/admin/reports/export?period=${period}`
  }

  const maxMissions = Math.max(...dailyStats.map((d) => d.missions), 1)
  const maxUsers = Math.max(...dailyStats.map((d) => d.users), 1)

  return (
    <AdminLayout title="Rapports">
      <Head title="Rapports - Admin Le Phare" />

      {/* Period selector */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {(['7', '30', '90'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {p} jours
            </button>
          ))}
        </div>
        <Button variant="outlined" onClick={handleExport}>
          📥 Exporter JSON
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nouveaux utilisateurs"
          value={currentStats.newUsers}
          previousValue={previousStats.newUsers}
          icon="👥"
        />
        <StatCard
          label="Missions complétées"
          value={currentStats.completedMissions}
          previousValue={previousStats.completedMissions}
          icon="✓"
        />
        <StatCard
          label="Tutoriels vus"
          value={currentStats.tutorialsViewed}
          previousValue={previousStats.tutorialsViewed}
          icon="📚"
        />
        <StatCard
          label="Revenu mensuel estimé"
          value={currentStats.revenue}
          previousValue={previousStats.revenue}
          icon="💰"
          suffix="€"
        />
      </div>

      {/* Subscription stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="text-center">
          <p className="text-3xl font-bold text-green-600">{currentStats.activeSubscriptions}</p>
          <p className="text-sm text-neutral-500">Abonnements actifs</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-blue-600">{currentStats.newSubscriptions}</p>
          <p className="text-sm text-neutral-500">Nouveaux abonnements</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold text-red-600">{currentStats.canceledSubscriptions}</p>
          <p className="text-sm text-neutral-500">Annulations</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily chart */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Évolution quotidienne</h2>

          {/* Legend */}
          <div className="flex gap-4 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-neutral-600">Missions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              <span className="text-neutral-600">Nouveaux utilisateurs</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-48 flex items-end gap-1">
            {dailyStats.slice(-14).map((day, index) => {
              const missionHeight = (day.missions / maxMissions) * 100
              const userHeight = (day.users / maxUsers) * 100

              return (
                <div key={index} className="flex-1 flex flex-col gap-0.5 items-center">
                  <div
                    className="w-full bg-primary rounded-t"
                    style={{ height: `${Math.max(missionHeight, 2)}%` }}
                    title={`${day.date}: ${day.missions} missions`}
                  />
                  <div
                    className="w-full bg-blue-400 rounded-t"
                    style={{ height: `${Math.max(userHeight, 2)}%` }}
                    title={`${day.date}: ${day.users} utilisateurs`}
                  />
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-xs text-neutral-400 mt-2">
            <span>{dailyStats[0]?.date}</span>
            <span>{dailyStats[dailyStats.length - 1]?.date}</span>
          </div>
        </Card>

        {/* Top performers */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Top utilisateurs</h2>

          {topUsers.length > 0 ? (
            <div className="space-y-3">
              {topUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                      index === 0
                        ? 'bg-yellow-500'
                        : index === 1
                          ? 'bg-neutral-400'
                          : index === 2
                            ? 'bg-orange-600'
                            : 'bg-neutral-300'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 truncate">{user.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900">{user.completedMissions}</p>
                    <p className="text-xs text-neutral-500">missions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              Aucune donnée sur cette période
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
