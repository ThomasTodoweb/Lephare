import { Head, Link, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'
import {
  Search, X, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Mail, Trash2, Download, Eye, Flame, MoreHorizontal
} from 'lucide-react'

// --- Types ---

interface UserListItem {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: string
  lastActivity: string | null
  isActive: boolean
  missionsCompleted: number
  currentStreak: number
  subscriptionStatus: string | null
  avatarUrl?: string | null
}

interface Props {
  users: UserListItem[]
  total: number
  page: number
  totalPages: number
  currentFilter: 'all' | 'active' | 'inactive' | 'trial'
  searchQuery: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

// --- Helpers ---

function formatDate(timestamp: string | null): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTimeAgo(timestamp: string | null): string {
  if (!timestamp) return 'Jamais'
  const now = new Date()
  const date = new Date(timestamp)
  const days = Math.floor((now.getTime() - date.getTime()) / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days}j`
  if (days < 30) return `Il y a ${Math.floor(days / 7)}sem`
  return `Il y a ${Math.floor(days / 30)}mois`
}

function UserAvatar({ user }: { user: UserListItem }) {
  const initials = user.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase()

  return (
    <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-[12px] font-semibold text-neutral-600 shrink-0">
      {initials}
    </div>
  )
}

function SubscriptionBadge({ status }: { status: string | null }) {
  if (!status) {
    return <span className="px-2 py-0.5 text-[11px] rounded-full bg-neutral-100 text-neutral-400">Free</span>
  }

  const config: Record<string, { bg: string; text: string; label: string }> = {
    active: { bg: 'bg-green-50', text: 'text-green-700', label: 'Actif' },
    trialing: { bg: 'bg-blue-50', text: 'text-blue-700', label: 'Trial' },
    canceled: { bg: 'bg-red-50', text: 'text-red-600', label: 'Annulé' },
    past_due: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Impayé' },
  }

  const c = config[status] || { bg: 'bg-neutral-100', text: 'text-neutral-500', label: status }

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'active' ? 'bg-green-500' :
        status === 'trialing' ? 'bg-blue-500' :
        status === 'canceled' ? 'bg-red-400' :
        status === 'past_due' ? 'bg-amber-500' : 'bg-neutral-400'
      }`} />
      {c.label}
    </span>
  )
}

// --- Side Panel ---

function UserSidePanel({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-in slide-in-from-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-bold text-[15px] text-neutral-900">Profil utilisateur</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Identity */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-neutral-200 flex items-center justify-center text-lg font-bold text-neutral-600">
              {user.fullName
                ? user.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                : user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-neutral-900">{user.fullName || 'Sans nom'}</p>
              <p className="text-[13px] text-neutral-500">{user.email}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-900">{user.missionsCompleted}</p>
              <p className="text-[11px] text-neutral-500">Missions</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-neutral-900 flex items-center justify-center gap-1">
                {user.currentStreak}
                {user.currentStreak > 0 && <Flame size={14} className="text-orange-500" />}
              </p>
              <p className="text-[11px] text-neutral-500">Streak</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <SubscriptionBadge status={user.subscriptionStatus} />
              <p className="text-[11px] text-neutral-500 mt-1">Abo</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-neutral-50">
              <span className="text-[13px] text-neutral-500">Statut</span>
              <span className={`inline-flex items-center gap-1.5 text-[13px] font-medium ${user.isActive ? 'text-green-600' : 'text-neutral-400'}`}>
                <span className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
                {user.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-50">
              <span className="text-[13px] text-neutral-500">Inscrit le</span>
              <span className="text-[13px] font-medium text-neutral-900">{formatDate(user.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-50">
              <span className="text-[13px] text-neutral-500">Dernière activité</span>
              <span className="text-[13px] font-medium text-neutral-900">{formatTimeAgo(user.lastActivity)}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-neutral-50">
              <span className="text-[13px] text-neutral-500">Rôle</span>
              <span className={`text-[13px] font-medium ${user.role === 'admin' ? 'text-purple-600' : 'text-neutral-900'}`}>
                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-neutral-100 p-4 flex gap-2">
          <Link href={`/admin/users/${user.id}`} className="flex-1">
            <Button size="sm" className="w-full" icon={Eye}>
              Voir détails
            </Button>
          </Link>
          <Button size="sm" variant="secondary" icon={Mail}>
            Email
          </Button>
        </div>
      </div>
    </>
  )
}

// --- Bulk Actions Bar ---

function BulkActionsBar({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-neutral-900 text-white rounded-2xl shadow-2xl px-6 py-3.5 flex items-center gap-4 animate-in slide-in-from-bottom">
      <span className="text-[13px] font-medium">
        {count} sélectionné{count > 1 ? 's' : ''}
      </span>
      <div className="h-5 w-px bg-neutral-700" />
      <button className="flex items-center gap-1.5 text-[13px] text-neutral-300 hover:text-white transition-colors">
        <Mail size={14} />
        Envoyer email
      </button>
      <button className="flex items-center gap-1.5 text-[13px] text-neutral-300 hover:text-white transition-colors">
        <Download size={14} />
        Exporter
      </button>
      <button className="flex items-center gap-1.5 text-[13px] text-red-400 hover:text-red-300 transition-colors">
        <Trash2 size={14} />
        Supprimer
      </button>
      <div className="h-5 w-px bg-neutral-700" />
      <button onClick={onClear} className="text-[13px] text-neutral-400 hover:text-white transition-colors">
        Annuler
      </button>
    </div>
  )
}

// --- Main Component ---

export default function AdminUsersIndex({
  users,
  total,
  page,
  totalPages,
  currentFilter,
  searchQuery,
  sortBy = 'createdAt',
  sortDir = 'desc',
}: Props) {
  const [search, setSearch] = useState(searchQuery)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [activePanelUser, setActivePanelUser] = useState<UserListItem | null>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const filters: { key: typeof currentFilter; label: string; count?: number }[] = [
    { key: 'all', label: 'Tous', count: total },
    { key: 'active', label: 'Actifs' },
    { key: 'inactive', label: 'Inactifs' },
    { key: 'trial', label: 'Trial' },
  ]

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => {
      router.get('/admin/users', { search: value, filter: currentFilter }, { preserveState: true })
    }, 300)
  }, [currentFilter])

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current)
    }
  }, [])

  const handleFilterChange = (filter: typeof currentFilter) => {
    router.get('/admin/users', { search, filter }, { preserveState: true })
  }

  const handleSort = (column: string) => {
    const newDir = sortBy === column && sortDir === 'asc' ? 'desc' : 'asc'
    router.get('/admin/users', { search, filter: currentFilter, sortBy: column, sortDir: newDir }, { preserveState: true })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === users.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(users.map((u) => u.id)))
    }
  }

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ChevronUp size={12} className="text-neutral-300" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-neutral-700" />
      : <ChevronDown size={12} className="text-neutral-700" />
  }

  return (
    <AdminLayout title="Utilisateurs">
      <Head title="Utilisateurs - Admin Le Phare" />

      {/* Search + Filters Row */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par nom ou email..."
            className="w-full pl-10 pr-4 py-2.5 text-[13px] bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
          />
          {search && (
            <button
              onClick={() => handleSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                currentFilter === f.key
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-[13px] text-neutral-500 mb-3">
        {total} utilisateur{total !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="w-10 pl-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === users.length && users.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-neutral-300 text-primary focus:ring-primary/20"
                  />
                </th>
                <th
                  className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                  onClick={() => handleSort('fullName')}
                >
                  <span className="flex items-center gap-1">Utilisateur <SortIcon column="fullName" /></span>
                </th>
                <th
                  className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                  onClick={() => handleSort('missionsCompleted')}
                >
                  <span className="flex items-center gap-1">Missions <SortIcon column="missionsCompleted" /></span>
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Streak
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Abonnement
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                  Statut
                </th>
                <th
                  className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 select-none"
                  onClick={() => handleSort('lastActivity')}
                >
                  <span className="flex items-center gap-1">Activité <SortIcon column="lastActivity" /></span>
                </th>
                <th className="w-10 pr-4" />
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`border-b border-neutral-50 hover:bg-neutral-50/50 transition-colors cursor-pointer ${
                    selectedIds.has(user.id) ? 'bg-primary/[0.03]' : ''
                  }`}
                  onClick={() => setActivePanelUser(user)}
                >
                  <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={() => toggleSelect(user.id)}
                      className="rounded border-neutral-300 text-primary focus:ring-primary/20"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-neutral-900 truncate">
                          {user.fullName || 'Sans nom'}
                        </p>
                        <p className="text-[12px] text-neutral-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] font-semibold text-neutral-900">{user.missionsCompleted}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[13px] text-neutral-900 flex items-center gap-1">
                      {user.currentStreak}j
                      {user.currentStreak > 3 && <Flame size={13} className="text-orange-500" />}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SubscriptionBadge status={user.subscriptionStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                      user.isActive ? 'text-green-600' : 'text-neutral-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-neutral-300'}`} />
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[12px] text-neutral-500">{formatTimeAgo(user.lastActivity)}</span>
                  </td>
                  <td className="pr-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors inline-flex"
                    >
                      <MoreHorizontal size={16} className="text-neutral-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[13px] text-neutral-500">Aucun utilisateur trouvé</p>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-[12px] text-neutral-500">
            Page {page} sur {totalPages}
          </p>
          <div className="flex gap-1">
            {page > 1 && (
              <Link
                href={`/admin/users?page=${page - 1}&filter=${currentFilter}&search=${search}&sortBy=${sortBy}&sortDir=${sortDir}`}
                className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </Link>
            )}
            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Link
                  key={pageNum}
                  href={`/admin/users?page=${pageNum}&filter=${currentFilter}&search=${search}&sortBy=${sortBy}&sortDir=${sortDir}`}
                  className={`w-9 h-9 rounded-lg text-[13px] font-medium flex items-center justify-center transition-colors ${
                    page === pageNum
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {pageNum}
                </Link>
              )
            })}
            {page < totalPages && (
              <Link
                href={`/admin/users?page=${page + 1}&filter=${currentFilter}&search=${search}&sortBy=${sortBy}&sortDir=${sortDir}`}
                className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Side Panel */}
      {activePanelUser && (
        <UserSidePanel user={activePanelUser} onClose={() => setActivePanelUser(null)} />
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <BulkActionsBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())} />
      )}
    </AdminLayout>
  )
}
