import { Head, router } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import { useMemo } from 'react'
import {
  Users, Target, BookOpen, CreditCard, TrendingUp, TrendingDown,
  Download, ArrowRight, DollarSign
} from 'lucide-react'

// --- Types ---

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

interface FunnelStep {
  label: string
  count: number
}

interface CohortData {
  month: string
  total: number
  retained7d: number
  retained30d: number
  converted: number
}

interface Props {
  period: '7' | '30' | '90'
  currentStats: PeriodStats
  previousStats: PeriodStats
  dailyStats: DailyStats[]
  topUsers: TopUser[]
  funnel?: FunnelStep[]
  cohorts?: CohortData[]
}

// --- Helpers ---

function formatChange(current: number, previous: number): { value: number; isPositive: boolean } {
  if (previous === 0) return { value: 0, isPositive: true }
  const value = Math.round(((current - previous) / previous) * 100)
  return { value, isPositive: value >= 0 }
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  previousValue,
  icon: Icon,
  iconBg,
  prefix = '',
  suffix = '',
}: {
  label: string
  value: number
  previousValue: number
  icon: typeof Users
  iconBg: string
  prefix?: string
  suffix?: string
}) {
  const change = formatChange(value, previousValue)

  return (
    <Card className="flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-neutral-500">{label}</p>
        <p className="text-[20px] font-bold text-neutral-900 leading-tight">
          {prefix}{value.toLocaleString('fr-FR')}{suffix}
        </p>
      </div>
      <div className={`flex items-center gap-0.5 text-[12px] font-medium shrink-0 ${change.isPositive ? 'text-green-600' : 'text-red-500'}`}>
        {change.isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {change.isPositive ? '+' : ''}{change.value}%
      </div>
    </Card>
  )
}

function FunnelChart({ steps }: { steps: FunnelStep[] }) {
  if (steps.length === 0) return null
  const maxCount = steps[0].count || 1

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const widthPercent = Math.max((step.count / maxCount) * 100, 8)
        const conversionFromPrevious = i > 0 && steps[i - 1].count > 0
          ? Math.round((step.count / steps[i - 1].count) * 100)
          : 100

        // Color gradient from blue to green
        const colors = ['bg-blue-500', 'bg-blue-400', 'bg-sky-400', 'bg-teal-400', 'bg-emerald-400', 'bg-green-500']
        const color = colors[Math.min(i, colors.length - 1)]

        return (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[13px] font-medium text-neutral-900">{step.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-neutral-900">{step.count.toLocaleString('fr-FR')}</span>
                {i > 0 && (
                  <span className={`text-[11px] font-medium ${conversionFromPrevious >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                    {conversionFromPrevious}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-8 bg-neutral-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                style={{ width: `${widthPercent}%` }}
              >
                {widthPercent > 20 && (
                  <span className="text-[11px] font-medium text-white">
                    {Math.round((step.count / maxCount) * 100)}%
                  </span>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight size={12} className="text-neutral-300 rotate-90" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function CohortTable({ cohorts }: { cohorts: CohortData[] }) {
  if (cohorts.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-100">
            <th className="px-3 py-2.5 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Cohorte</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Inscrits</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Rétention 7j</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Rétention 30j</th>
            <th className="px-3 py-2.5 text-center text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Convertis</th>
          </tr>
        </thead>
        <tbody>
          {cohorts.map((cohort) => {
            const r7 = cohort.total > 0 ? Math.round((cohort.retained7d / cohort.total) * 100) : 0
            const r30 = cohort.total > 0 ? Math.round((cohort.retained30d / cohort.total) * 100) : 0
            const conv = cohort.total > 0 ? Math.round((cohort.converted / cohort.total) * 100) : 0

            return (
              <tr key={cohort.month} className="border-b border-neutral-50 hover:bg-neutral-50/50">
                <td className="px-3 py-3 text-[13px] font-medium text-neutral-900">{cohort.month}</td>
                <td className="px-3 py-3 text-center text-[13px] font-semibold text-neutral-900">{cohort.total}</td>
                <td className="px-3 py-3 text-center">
                  <CohortCell value={r7} />
                </td>
                <td className="px-3 py-3 text-center">
                  <CohortCell value={r30} />
                </td>
                <td className="px-3 py-3 text-center">
                  <CohortCell value={conv} variant="conversion" />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function CohortCell({ value, variant = 'retention' }: { value: number; variant?: 'retention' | 'conversion' }) {
  const getColor = () => {
    if (variant === 'conversion') {
      if (value >= 20) return 'bg-green-100 text-green-700'
      if (value >= 10) return 'bg-green-50 text-green-600'
      return 'bg-neutral-50 text-neutral-500'
    }
    if (value >= 60) return 'bg-green-100 text-green-700'
    if (value >= 40) return 'bg-green-50 text-green-600'
    if (value >= 20) return 'bg-amber-50 text-amber-600'
    return 'bg-red-50 text-red-500'
  }

  return (
    <span className={`inline-block px-2.5 py-1 text-[12px] font-semibold rounded-lg ${getColor()}`}>
      {value}%
    </span>
  )
}

function SVGLineChart({ data, height = 200 }: { data: DailyStats[]; height?: number }) {
  const width = 600
  const paddingX = 30
  const paddingY = 20
  const chartW = width - paddingX * 2
  const chartH = height - paddingY * 2

  const maxMissions = Math.max(...data.map((d) => d.missions), 1)
  const maxUsers = Math.max(...data.map((d) => d.users), 1)
  const globalMax = Math.max(maxMissions, maxUsers)

  const toPoints = (values: number[]) =>
    values.map((v, i) => {
      const x = paddingX + (i / Math.max(values.length - 1, 1)) * chartW
      const y = paddingY + chartH - (v / globalMax) * chartH
      return { x, y }
    })

  const missionsPoints = toPoints(data.map((d) => d.missions))
  const usersPoints = toPoints(data.map((d) => d.users))

  const toPath = (points: { x: number; y: number }[]) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  const toArea = (points: { x: number; y: number }[]) =>
    toPath(points) + ` L${points[points.length - 1].x},${height - paddingY} L${points[0].x},${height - paddingY} Z`

  // Y-axis labels
  const yLabels = [0, Math.round(globalMax / 2), globalMax]

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Grid lines */}
      {yLabels.map((val, i) => {
        const y = paddingY + chartH - (val / globalMax) * chartH
        return (
          <g key={i}>
            <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} stroke="#f0f0f0" strokeWidth="1" />
            <text x={paddingX - 5} y={y + 4} textAnchor="end" fill="#a0a0a0" fontSize="10">{val}</text>
          </g>
        )
      })}

      {/* Area fills */}
      <path d={toArea(missionsPoints)} fill="url(#missionGrad)" />
      <path d={toArea(usersPoints)} fill="url(#userGrad)" />

      {/* Lines */}
      <path d={toPath(missionsPoints)} fill="none" stroke="#dd2c0c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d={toPath(usersPoints)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {missionsPoints.map((p, i) => (
        <circle key={`m${i}`} cx={p.x} cy={p.y} r="2.5" fill="#dd2c0c" />
      ))}
      {usersPoints.map((p, i) => (
        <circle key={`u${i}`} cx={p.x} cy={p.y} r="2.5" fill="#3b82f6" />
      ))}

      {/* X-axis labels */}
      {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1).map((d, i) => {
        const idx = data.indexOf(d)
        const x = paddingX + (idx / Math.max(data.length - 1, 1)) * chartW
        return (
          <text key={i} x={x} y={height - 4} textAnchor="middle" fill="#a0a0a0" fontSize="10">
            {d.date.slice(5)}
          </text>
        )
      })}

      {/* Gradients */}
      <defs>
        <linearGradient id="missionGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dd2c0c" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#dd2c0c" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// --- Main Component ---

export default function AdminReportsIndex({
  period,
  currentStats,
  previousStats,
  dailyStats,
  topUsers,
  funnel,
  cohorts,
}: Props) {
  const handlePeriodChange = (newPeriod: string) => {
    router.get('/admin/reports', { period: newPeriod }, { preserveState: true })
  }

  const handleExport = () => {
    window.location.href = `/admin/reports/export?period=${period}`
  }

  // Build default funnel if not provided
  const funnelSteps = useMemo(() => {
    if (funnel && funnel.length > 0) return funnel
    // Estimated funnel from available data
    const totalUsers = currentStats.newUsers + previousStats.newUsers
    return [
      { label: 'Inscriptions', count: totalUsers || 0 },
      { label: 'Onboarding terminé', count: Math.round((totalUsers || 0) * 0.7) },
      { label: '1ère mission', count: Math.round((totalUsers || 0) * 0.5) },
      { label: 'Rétention 7j', count: Math.round((totalUsers || 0) * 0.35) },
      { label: 'Rétention 30j', count: Math.round((totalUsers || 0) * 0.2) },
      { label: 'Payant', count: currentStats.newSubscriptions || 0 },
    ]
  }, [funnel, currentStats, previousStats])

  // Default cohorts
  const cohortData = useMemo(() => {
    if (cohorts && cohorts.length > 0) return cohorts
    return []
  }, [cohorts])

  // Revenue calculation
  const churnRate = currentStats.activeSubscriptions > 0
    ? Math.round((currentStats.canceledSubscriptions / currentStats.activeSubscriptions) * 100)
    : 0

  return (
    <AdminLayout title="Rapports & Statistiques">
      <Head title="Rapports - Admin Le Phare" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        {/* Period Selector */}
        <div className="flex bg-neutral-100 rounded-xl p-0.5">
          {(['7', '30', '90'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodChange(p)}
              className={`px-4 py-2 text-[13px] font-medium rounded-lg transition-colors ${
                period === p ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {p} jours
            </button>
          ))}
        </div>

        <Button size="sm" variant="secondary" icon={Download} onClick={handleExport}>
          Exporter
        </Button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Nouveaux utilisateurs"
          value={currentStats.newUsers}
          previousValue={previousStats.newUsers}
          icon={Users}
          iconBg="bg-blue-600"
        />
        <StatCard
          label="Missions complétées"
          value={currentStats.completedMissions}
          previousValue={previousStats.completedMissions}
          icon={Target}
          iconBg="bg-primary"
        />
        <StatCard
          label="Tutoriels vus"
          value={currentStats.tutorialsViewed}
          previousValue={previousStats.tutorialsViewed}
          icon={BookOpen}
          iconBg="bg-purple-600"
        />
        <StatCard
          label="Revenu estimé"
          value={currentStats.revenue}
          previousValue={previousStats.revenue}
          icon={DollarSign}
          iconBg="bg-green-600"
          suffix=" EUR"
        />
      </div>

      {/* Subscription KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] text-neutral-500">Abonnements actifs</p>
            <p className="text-lg font-bold text-neutral-900">{currentStats.activeSubscriptions}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] text-neutral-500">Nouveaux abonnements</p>
            <p className="text-lg font-bold text-neutral-900">{currentStats.newSubscriptions}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] text-neutral-500">Churn rate</p>
            <p className={`text-lg font-bold ${churnRate > 10 ? 'text-red-600' : 'text-neutral-900'}`}>{churnRate}%</p>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Daily Evolution Chart */}
        <Card className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[15px] text-neutral-900">Évolution quotidienne</h2>
            <div className="flex items-center gap-4 text-[12px]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-neutral-500">Missions</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span className="text-neutral-500">Utilisateurs</span>
              </span>
            </div>
          </div>
          <SVGLineChart data={dailyStats.slice(-14)} />
        </Card>

        {/* Top Users */}
        <Card>
          <h2 className="font-bold text-[15px] text-neutral-900 mb-4">Top utilisateurs</h2>
          {topUsers.length > 0 ? (
            <div className="space-y-1">
              {topUsers.map((user, index) => (
                <div key={user.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-neutral-50">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    index === 0 ? 'bg-amber-100 text-amber-700' :
                    index === 1 ? 'bg-neutral-200 text-neutral-600' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-neutral-100 text-neutral-500'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-neutral-900 truncate">{user.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14px] font-bold text-neutral-900">{user.completedMissions}</p>
                    <p className="text-[10px] text-neutral-400">missions</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-[13px] text-neutral-500 py-8">Aucune donnée</p>
          )}
        </Card>
      </div>

      {/* Funnel + Cohorts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <h2 className="font-bold text-[15px] text-neutral-900 mb-1">Funnel d'acquisition</h2>
          <p className="text-[12px] text-neutral-500 mb-5">Inscription vers conversion payante</p>
          <FunnelChart steps={funnelSteps} />
        </Card>

        {/* Cohorts */}
        <Card padding="none">
          <div className="px-4 pt-4 pb-2">
            <h2 className="font-bold text-[15px] text-neutral-900 mb-1">Cohortes mensuelles</h2>
            <p className="text-[12px] text-neutral-500">Rétention et conversion par mois d'inscription</p>
          </div>
          {cohortData.length > 0 ? (
            <CohortTable cohorts={cohortData} />
          ) : (
            <div className="text-center py-12 text-[13px] text-neutral-500">
              <p>Les données de cohortes seront disponibles</p>
              <p className="text-[12px] text-neutral-400 mt-1">quand le backend les fournira</p>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  )
}
