import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface SubscriptionItem {
  id: number
  userId: number
  planType: 'free_trial' | 'monthly' | 'yearly'
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  user: {
    id: number
    email: string
    fullName: string | null
  }
}

interface Stats {
  total: number
  active: number
  trialing: number
  canceled: number
  past_due: number
  new30Days: number
  churned30Days: number
  conversions: number
  mrr: number
}

interface Props {
  subscriptions: {
    data: SubscriptionItem[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  }
  stats: Stats
  filters: {
    status: string
    search: string
  }
}

function formatDate(timestamp: string | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatDateTime(timestamp: string | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-yellow-100 text-yellow-700',
    incomplete: 'bg-neutral-100 text-neutral-500',
  }

  const labels: Record<string, string> = {
    active: 'Actif',
    trialing: 'Trial',
    canceled: 'Annule',
    past_due: 'Impaye',
    incomplete: 'Incomplet',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-neutral-100'}`}>
      {labels[status] || status}
    </span>
  )
}

function PlanBadge({ planType }: { planType: string }) {
  const styles: Record<string, string> = {
    free_trial: 'bg-purple-100 text-purple-700',
    monthly: 'bg-primary/10 text-primary',
    yearly: 'bg-amber-100 text-amber-700',
  }

  const labels: Record<string, string> = {
    free_trial: 'Essai',
    monthly: 'Mensuel',
    yearly: 'Annuel',
  }

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[planType] || 'bg-neutral-100'}`}>
      {labels[planType] || planType}
    </span>
  )
}

function StatCard({
  label,
  value,
  sublabel,
  color = 'neutral',
}: {
  label: string
  value: number | string
  sublabel?: string
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'neutral' | 'primary'
}) {
  const colors: Record<string, string> = {
    green: 'text-green-600',
    blue: 'text-blue-600',
    red: 'text-red-600',
    yellow: 'text-yellow-600',
    neutral: 'text-neutral-600',
    primary: 'text-primary',
  }

  return (
    <Card className="p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
      {sublabel && <p className="text-xs text-neutral-400 mt-1">{sublabel}</p>}
    </Card>
  )
}

export default function AdminSubscriptionsIndex({ subscriptions, stats, filters }: Props) {
  const [search, setSearch] = useState(filters.search)
  const { data, meta } = subscriptions

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get('/admin/subscriptions', { search, status: filters.status }, { preserveState: true })
  }

  const handleStatusFilter = (status: string) => {
    router.get('/admin/subscriptions', { search, status }, { preserveState: true })
  }

  return (
    <AdminLayout title="Abonnements">
      <Head title="Abonnements - Admin Le Phare" />

      {/* Stats overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Actifs" value={stats.active} color="green" />
        <StatCard label="En trial" value={stats.trialing} color="blue" />
        <StatCard label="Annules" value={stats.canceled} color="red" />
        <StatCard label="MRR" value={`${stats.mrr} EUR`} color="primary" sublabel="Revenu mensuel" />
        <StatCard
          label="Nouveaux (30j)"
          value={stats.new30Days}
          color="green"
          sublabel={`Churns: ${stats.churned30Days}`}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'Tous' },
            { value: 'active', label: 'Actifs' },
            { value: 'trialing', label: 'Trial' },
            { value: 'canceled', label: 'Annules' },
            { value: 'past_due', label: 'Impayes' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filters.status === option.value
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par email..."
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit">Rechercher</Button>
        </form>
      </div>

      {/* Count */}
      <div className="mb-4 text-sm text-neutral-500">
        {meta.total} abonnement{meta.total !== 1 ? 's' : ''} trouve{meta.total !== 1 ? 's' : ''}
      </div>

      {/* Subscriptions table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Fin periode
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Cree le
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {data.map((sub) => (
                <tr key={sub.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {sub.user.fullName || 'Sans nom'}
                      </p>
                      <p className="text-sm text-neutral-500">{sub.user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <PlanBadge planType={sub.planType} />
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge status={sub.status} />
                    {sub.status === 'trialing' && sub.trialEndsAt && (
                      <p className="text-xs text-neutral-400 mt-1">
                        Fin: {formatDate(sub.trialEndsAt)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">
                    {formatDate(sub.currentPeriodEnd)}
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">
                    {formatDateTime(sub.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/subscriptions/${sub.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Gerer
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className="text-center py-12 text-neutral-500">Aucun abonnement trouve</div>
        )}
      </Card>

      {/* Pagination */}
      {meta.lastPage > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {meta.currentPage > 1 && (
            <Link
              href={`/admin/subscriptions?page=${meta.currentPage - 1}&status=${filters.status}&search=${search}`}
              className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Precedent
            </Link>
          )}

          <span className="px-4 py-2 text-neutral-500">
            Page {meta.currentPage} sur {meta.lastPage}
          </span>

          {meta.currentPage < meta.lastPage && (
            <Link
              href={`/admin/subscriptions?page=${meta.currentPage + 1}&status=${filters.status}&search=${search}`}
              className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Suivant
            </Link>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
