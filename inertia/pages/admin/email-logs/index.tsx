import { Head, Link, router, usePage } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'
import { useState } from 'react'

interface EmailLog {
  id: number
  toEmail: string
  toName: string | null
  subject: string
  emailType: string
  provider: string
  status: 'pending' | 'sent' | 'failed' | 'bounced' | 'complained'
  errorMessage: string | null
  errorCode: string | null
  providerMessageId: string | null
  userId: number | null
  sentAt: string | null
  createdAt: string
  user?: {
    id: number
    email: string
    fullName: string | null
  }
}

interface Stats {
  total: number
  sent: number
  failed: number
  bounced: number
  last24h: number
  last24hFailed: number
}

interface Props {
  logs: {
    data: EmailLog[]
    meta: {
      total: number
      perPage: number
      currentPage: number
      lastPage: number
    }
  }
  filters: {
    status?: string
    emailType?: string
    search?: string
  }
  stats: Stats
}

export default function EmailLogsIndex({ logs, filters, stats }: Props) {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }
  const [search, setSearch] = useState(filters.search || '')

  const handleFilter = (key: string, value: string) => {
    router.get('/admin/email-logs', {
      ...filters,
      [key]: value,
      page: 1,
    }, { preserveState: true })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilter('search', search)
  }

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    sent: 'Envoye',
    failed: 'Echec',
    bounced: 'Rejete',
    complained: 'Spam',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    sent: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    bounced: 'bg-orange-100 text-orange-800',
    complained: 'bg-purple-100 text-purple-800',
  }

  const typeLabels: Record<string, string> = {
    verification: 'Verification',
    welcome: 'Bienvenue',
    password_reset: 'Reset MDP',
    daily_mission: 'Mission',
    test: 'Test',
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AdminLayout>
      <Head title="Historique emails - Admin" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Historique des emails
            </h1>
            <p className="text-neutral-600 mt-1">
              Suivez tous les emails envoyes par la plateforme
            </p>
          </div>
          <Link href="/admin/emails">
            <Button variant="secondary">
              Configuration
            </Button>
          </Link>
        </div>

        {/* Flash messages */}
        {flash?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
            {flash.success}
          </div>
        )}
        {flash?.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {flash.error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
            <div className="text-sm text-neutral-500">Total</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            <div className="text-sm text-neutral-500">Envoyes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-neutral-500">Echecs</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.bounced}</div>
            <div className="text-sm text-neutral-500">Rejetes</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.last24h}</div>
            <div className="text-sm text-neutral-500">24h</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.last24hFailed}</div>
            <div className="text-sm text-neutral-500">Echecs 24h</div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Rechercher par email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <Button type="submit" variant="secondary">
                Rechercher
              </Button>
            </form>

            {/* Status filter */}
            <select
              value={filters.status || 'all'}
              onChange={(e) => handleFilter('status', e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="sent">Envoyes</option>
              <option value="failed">Echecs</option>
              <option value="bounced">Rejetes</option>
              <option value="pending">En attente</option>
              <option value="complained">Spam</option>
            </select>

            {/* Type filter */}
            <select
              value={filters.emailType || 'all'}
              onChange={(e) => handleFilter('type', e.target.value)}
              className="px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="verification">Verification</option>
              <option value="welcome">Bienvenue</option>
              <option value="password_reset">Reset MDP</option>
              <option value="daily_mission">Mission</option>
              <option value="test">Test</option>
            </select>
          </div>
        </Card>

        {/* Logs table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Destinataire</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Sujet</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-600 uppercase">Provider</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {logs.data.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-neutral-500">
                      Aucun email envoye
                    </td>
                  </tr>
                ) : (
                  logs.data.map((log) => (
                    <tr key={log.id} className="hover:bg-neutral-50">
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-neutral-900">{log.toEmail}</div>
                        {log.toName && (
                          <div className="text-xs text-neutral-500">{log.toName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 max-w-[200px] truncate">
                        {log.subject}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                          {typeLabels[log.emailType] || log.emailType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[log.status]}`}>
                          {statusLabels[log.status] || log.status}
                        </span>
                        {log.errorMessage && (
                          <div className="text-xs text-red-500 mt-1 truncate max-w-[150px]" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-neutral-600 uppercase">
                        {log.provider}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/email-logs/${log.id}`}>
                          <Button variant="ghost" size="sm">
                            Details
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {logs.meta.lastPage > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
              <div className="text-sm text-neutral-600">
                Page {logs.meta.currentPage} sur {logs.meta.lastPage} ({logs.meta.total} resultats)
              </div>
              <div className="flex gap-2">
                {logs.meta.currentPage > 1 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.get('/admin/email-logs', { ...filters, page: logs.meta.currentPage - 1 })}
                  >
                    Precedent
                  </Button>
                )}
                {logs.meta.currentPage < logs.meta.lastPage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.get('/admin/email-logs', { ...filters, page: logs.meta.currentPage + 1 })}
                  >
                    Suivant
                  </Button>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Cleanup */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-neutral-900">Nettoyage</h3>
              <p className="text-sm text-neutral-500">Supprimer les anciens logs pour liberer de l'espace</p>
            </div>
            <form method="POST" action="/admin/email-logs/cleanup">
              <input type="hidden" name="_token" value="" />
              <Button
                type="submit"
                variant="secondary"
                onClick={(e) => {
                  if (!confirm('Supprimer tous les logs de plus de 30 jours ?')) {
                    e.preventDefault()
                  }
                }}
              >
                Supprimer les logs &gt; 30 jours
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </AdminLayout>
  )
}
