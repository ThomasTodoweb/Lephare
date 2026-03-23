import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import { useState, useMemo } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card } from '~/components/ui'
import {
  Users, TrendingUp, TrendingDown, Target, CreditCard, Flame,
  AlertTriangle, Clock, ArrowUpRight, ChevronRight,
  UserPlus, CheckCircle2, BookOpen, Star
} from 'lucide-react'

// --- Types ---

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
  mrr: number
  missionsPerDay: number
  newUsersToday: number
  newUsersThisWeek: number
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

interface TopUser {
  id: number
  fullName: string
  email: string
  missionsCompleted: number
  currentStreak: number
  avatarUrl?: string | null
}

interface Alert {
  type: 'inactive_users' | 'expiring_subscriptions' | 'past_due' | 'low_completion'
  count: number
  message: string
  severity: 'warning' | 'danger' | 'info'
}

interface Props {
  globalStats: GlobalStats
  userGrowth: UserGrowth[]
  recentActivity: RecentActivity[]
  topUsers?: TopUser[]
  alerts?: Alert[]
}

// --- Sub-components ---

function KPICard({
  label,
  value,
  change,
  icon: Icon,
  iconBg,
  prefix = '',
  suffix = '',
}: {
  label: string
  value: number | string
  change?: number
  icon: typeof Users
  iconBg: string
  prefix?: string
  suffix?: string
}) {
  const isPositive = (change ?? 0) >= 0
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-neutral-500 truncate">{label}</p>
        <p className="text-[22px] font-bold text-neutral-900 leading-tight">
          {prefix}{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}{suffix}
        </p>
      </div>
      {change !== undefined && (
        <div className={`flex items-center gap-0.5 text-[13px] font-medium shrink-0 ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {isPositive ? '+' : ''}{change}%
        </div>
      )}
    </Card>
  )
}

function MiniSparkline({ data, color = '#dd2c0c' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const width = 120
  const height = 40
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const areaPoints = [...points, `${width - padding},${height}`, `${padding},${height}`]

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints.join(' ')}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ActivityIcon({ type }: { type: RecentActivity['type'] }) {
  switch (type) {
    case 'user_joined':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <UserPlus size={14} className="text-blue-600" />
        </div>
      )
    case 'mission_completed':
      return (
        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 size={14} className="text-green-600" />
        </div>
      )
    case 'tutorial_completed':
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
          <BookOpen size={14} className="text-purple-600" />
        </div>
      )
    case 'subscription_started':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
          <Star size={14} className="text-amber-600" />
        </div>
      )
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

  if (seconds < 60) return "A l'instant"
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)}min`
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)}h`
  return `Il y a ${Math.floor(seconds / 86400)}j`
}

// --- Main Component ---

export default function AdminDashboard({ globalStats, userGrowth, recentActivity, topUsers = [], alerts = [] }: Props) {
  const [chartRange, setChartRange] = useState<'7' | '14' | '30'>('30')

  const chartData = useMemo(() => {
    const days = parseInt(chartRange)
    return userGrowth.slice(-days)
  }, [userGrowth, chartRange])

  const sparklineData = useMemo(() => userGrowth.slice(-14).map((g) => g.count), [userGrowth])

  const maxGrowth = Math.max(...chartData.map((g) => g.count), 1)

  return (
    <AdminLayout title="Dashboard">
      <Head title="Admin Dashboard - Le Phare" />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Utilisateurs"
          value={globalStats.totalUsers}
          change={globalStats.newUsersThisWeek ? Math.round((globalStats.newUsersThisWeek / Math.max(globalStats.totalUsers - globalStats.newUsersThisWeek, 1)) * 100) : undefined}
          icon={Users}
          iconBg="bg-blue-600"
        />
        <KPICard
          label="MRR"
          value={globalStats.mrr || globalStats.activeSubscriptions * 29}
          prefix=""
          suffix=" EUR"
          icon={CreditCard}
          iconBg="bg-green-600"
        />
        <KPICard
          label="Missions / jour"
          value={globalStats.missionsPerDay || Math.round(globalStats.completedMissions / 30)}
          icon={Target}
          iconBg="bg-primary"
        />
        <KPICard
          label="Taux complétion"
          value={`${globalStats.completionRate}%`}
          icon={Flame}
          iconBg={globalStats.completionRate >= 50 ? 'bg-green-600' : 'bg-amber-500'}
        />
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${
                alert.severity === 'danger'
                  ? 'bg-red-50 text-red-800 border border-red-100'
                  : alert.severity === 'warning'
                    ? 'bg-amber-50 text-amber-800 border border-amber-100'
                    : 'bg-blue-50 text-blue-800 border border-blue-100'
              }`}
            >
              <AlertTriangle size={16} className="shrink-0" />
              <span className="flex-1">{alert.message}</span>
              <span className="font-bold">{alert.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fallback alerts from stats when alerts prop is empty */}
      {alerts.length === 0 && (globalStats.inactiveUsers > 0 || globalStats.trialSubscriptions > 0) && (
        <div className="mb-6 space-y-2">
          {globalStats.inactiveUsers > 5 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-amber-50 text-amber-800 border border-amber-100">
              <AlertTriangle size={16} className="shrink-0" />
              <span className="flex-1">{globalStats.inactiveUsers} utilisateurs inactifs depuis +30 jours</span>
              <Link href="/admin/users?filter=inactive" className="font-medium underline underline-offset-2">
                Voir
              </Link>
            </div>
          )}
          {globalStats.trialSubscriptions > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm bg-blue-50 text-blue-800 border border-blue-100">
              <Clock size={16} className="shrink-0" />
              <span className="flex-1">{globalStats.trialSubscriptions} abonnements en période d'essai</span>
              <Link href="/admin/subscriptions" className="font-medium underline underline-offset-2">
                Voir
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Chart + Top Users */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Growth Chart - 2 cols */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-bold text-[15px] text-neutral-900">Croissance utilisateurs</h2>
              <p className="text-[13px] text-neutral-500 mt-0.5">Inscriptions par jour</p>
            </div>
            <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
              {(['7', '14', '30'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setChartRange(range)}
                  className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-colors ${
                    chartRange === range
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700'
                  }`}
                >
                  {range}j
                </button>
              ))}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-52 flex items-end gap-[3px] px-1">
            {chartData.map((point, index) => {
              const height = (point.count / maxGrowth) * 100
              return (
                <div key={index} className="flex-1 group relative">
                  <div
                    className="w-full bg-primary/80 rounded-t-sm hover:bg-primary transition-colors"
                    style={{ height: `${Math.max(height, 3)}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-neutral-900 text-white text-[11px] px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                      <p className="font-medium">{point.count} inscription{point.count > 1 ? 's' : ''}</p>
                      <p className="text-neutral-400">{point.date}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-[11px] text-neutral-400 mt-3 px-1">
            <span>{chartData[0]?.date}</span>
            <span>{chartData[chartData.length - 1]?.date}</span>
          </div>
        </Card>

        {/* Top 10 Users */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] text-neutral-900">Top utilisateurs</h2>
            <Link href="/admin/users" className="text-[12px] text-primary font-medium flex items-center gap-0.5 hover:underline">
              Tous <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-1">
            {(topUsers.length > 0 ? topUsers : []).slice(0, 10).map((user, index) => (
              <Link
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  index === 0 ? 'bg-amber-100 text-amber-700' :
                  index === 1 ? 'bg-neutral-200 text-neutral-600' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-neutral-100 text-neutral-500'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-neutral-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    {user.missionsCompleted} missions
                    {user.currentStreak > 0 && <span className="ml-1 text-orange-500">{user.currentStreak}j streak</span>}
                  </p>
                </div>
                <ArrowUpRight size={14} className="text-neutral-300 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
            {topUsers.length === 0 && (
              <p className="text-[13px] text-neutral-500 text-center py-8">Aucun utilisateur</p>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Grid: Activity + Quick Stats */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] text-neutral-900">Activité récente</h2>
            <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              En direct
            </div>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] text-neutral-900">
                      <span className="font-medium">{activity.userName}</span>
                      {' '}
                      <span className="text-neutral-500">
                        — <ActivityLabel type={activity.type} />
                      </span>
                    </p>
                    {activity.details && (
                      <p className="text-[12px] text-neutral-400 truncate">{activity.details}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-neutral-400 whitespace-nowrap shrink-0">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-neutral-500 py-12 text-[13px]">Aucune activité récente</p>
            )}
          </div>
        </Card>

        {/* Quick Stats Sidebar */}
        <div className="space-y-4">
          {/* Sparkline card */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-neutral-500">Inscriptions 14j</p>
                <p className="text-xl font-bold text-neutral-900">
                  {globalStats.newUsersToday || sparklineData[sparklineData.length - 1] || 0}
                  <span className="text-[13px] font-normal text-neutral-400 ml-1">aujourd'hui</span>
                </p>
              </div>
              <MiniSparkline data={sparklineData} />
            </div>
          </Card>

          {/* Secondary KPIs */}
          <Card>
            <h3 className="text-[13px] font-semibold text-neutral-900 mb-3">Vue d'ensemble</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Missions générées</span>
                <span className="text-[15px] font-bold text-neutral-900">{globalStats.totalMissions.toLocaleString('fr-FR')}</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Utilisateurs actifs</span>
                <span className="text-[15px] font-bold text-neutral-900">{globalStats.activeUsers}</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Streak moyen</span>
                <span className="text-[15px] font-bold text-neutral-900">{globalStats.averageStreak}j</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Abonnements actifs</span>
                <span className="text-[15px] font-bold text-green-600">{globalStats.activeSubscriptions}</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">En trial</span>
                <span className="text-[15px] font-bold text-blue-600">{globalStats.trialSubscriptions}</span>
              </div>
              <div className="h-px bg-neutral-100" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Inactifs (+30j)</span>
                <span className="text-[15px] font-bold text-red-500">{globalStats.inactiveUsers}</span>
              </div>
            </div>
          </Card>

          {/* Tutoriels */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] text-neutral-500">Tutoriels complétés</p>
                <p className="text-xl font-bold text-neutral-900">{globalStats.tutorialsCompleted}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <BookOpen size={22} className="text-purple-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
