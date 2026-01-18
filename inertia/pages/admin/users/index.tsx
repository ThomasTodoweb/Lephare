import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface UserListItem {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: string
  lastActivity: string | null
  isActive: boolean
  missionsCompleted: number
  subscriptionStatus: string | null
}

interface Props {
  users: UserListItem[]
  total: number
  page: number
  totalPages: number
  currentFilter: 'all' | 'active' | 'inactive'
  searchQuery: string
}

function formatDate(timestamp: string): string {
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function SubscriptionBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-500">-</span>
  }

  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-yellow-100 text-yellow-700',
  }

  const labels: Record<string, string> = {
    active: 'Actif',
    trialing: 'Trial',
    canceled: 'Annulé',
    past_due: 'Impayé',
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-neutral-100'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AdminUsersIndex({
  users,
  total,
  page,
  totalPages,
  currentFilter,
  searchQuery,
}: Props) {
  const [search, setSearch] = useState(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.get('/admin/users', { search, filter: currentFilter }, { preserveState: true })
  }

  const handleFilterChange = (filter: 'all' | 'active' | 'inactive') => {
    router.get('/admin/users', { search, filter }, { preserveState: true })
  }

  return (
    <AdminLayout title="Utilisateurs">
      <Head title="Utilisateurs - Admin Le Phare" />

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => handleFilterChange(filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentFilter === filter
                  ? 'bg-primary text-white'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {filter === 'all' ? 'Tous' : filter === 'active' ? 'Actifs' : 'Inactifs'}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button type="submit">Rechercher</Button>
        </form>
      </div>

      {/* Stats summary */}
      <div className="mb-4 text-sm text-neutral-500">
        {total} utilisateur{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}
      </div>

      {/* Users table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Missions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Inscrit le
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-neutral-50">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {user.fullName || 'Sans nom'}
                      </p>
                      <p className="text-sm text-neutral-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        user.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-100 text-neutral-500'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          user.isActive ? 'bg-green-500' : 'bg-neutral-400'
                        }`}
                      />
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-medium text-neutral-900">{user.missionsCompleted}</span>
                  </td>
                  <td className="px-4 py-4">
                    <SubscriptionBadge status={user.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-4 text-sm text-neutral-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-primary hover:text-primary/80 text-sm font-medium"
                    >
                      Voir détail →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            Aucun utilisateur trouvé
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/admin/users?page=${page - 1}&filter=${currentFilter}&search=${search}`}
              className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              ← Précédent
            </Link>
          )}

          <span className="px-4 py-2 text-neutral-500">
            Page {page} sur {totalPages}
          </span>

          {page < totalPages && (
            <Link
              href={`/admin/users?page=${page + 1}&filter=${currentFilter}&search=${search}`}
              className="px-4 py-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
