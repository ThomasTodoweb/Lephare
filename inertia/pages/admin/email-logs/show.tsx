import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { AdminLayout } from '~/components/layouts/AdminLayout'
import { Card } from '~/components/ui/Card'
import { Button } from '~/components/ui/Button'

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
  providerResponse: Record<string, unknown> | null
  userId: number | null
  sentAt: string | null
  createdAt: string
  updatedAt: string
  user?: {
    id: number
    email: string
    fullName: string | null
  }
}

interface Props {
  log: EmailLog
}

export default function EmailLogShow({ log }: Props) {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }
  const form = useForm({
    status: log.status,
    errorMessage: log.errorMessage || '',
  })

  const statusLabels: Record<string, string> = {
    pending: 'En attente',
    sent: 'Envoye',
    failed: 'Echec',
    bounced: 'Rejete',
    complained: 'Signale spam',
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    sent: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    bounced: 'bg-orange-100 text-orange-800 border-orange-200',
    complained: 'bg-purple-100 text-purple-800 border-purple-200',
  }

  const typeLabels: Record<string, string> = {
    verification: 'Email de verification',
    welcome: 'Email de bienvenue',
    password_reset: 'Reinitialisation mot de passe',
    daily_mission: 'Mission quotidienne',
    test: 'Email de test',
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault()
    form.post(`/admin/email-logs/${log.id}/status`)
  }

  return (
    <AdminLayout>
      <Head title={`Email #${log.id} - Admin`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/email-logs">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
                Email #{log.id}
              </h1>
              <p className="text-neutral-600 mt-1">
                {typeLabels[log.emailType] || log.emailType}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl border text-lg font-semibold ${statusColors[log.status]}`}>
            {statusLabels[log.status] || log.status}
          </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main info */}
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 uppercase">Informations</h2>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-neutral-500">Destinataire</label>
                <p className="text-lg font-semibold text-neutral-900">{log.toEmail}</p>
                {log.toName && <p className="text-neutral-600">{log.toName}</p>}
              </div>

              <div>
                <label className="text-sm font-medium text-neutral-500">Sujet</label>
                <p className="text-neutral-900">{log.subject}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">Type</label>
                  <p className="text-neutral-900">{typeLabels[log.emailType] || log.emailType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">Provider</label>
                  <p className="text-neutral-900 uppercase">{log.provider}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">Cree le</label>
                  <p className="text-neutral-900 text-sm">{formatDate(log.createdAt)}</p>
                </div>
                {log.sentAt && (
                  <div>
                    <label className="text-sm font-medium text-neutral-500">Envoye le</label>
                    <p className="text-neutral-900 text-sm">{formatDate(log.sentAt)}</p>
                  </div>
                )}
              </div>

              {log.user && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Utilisateur associe</label>
                  <Link href={`/admin/users?search=${log.user.email}`} className="block">
                    <p className="text-primary hover:underline">
                      {log.user.fullName || log.user.email}
                    </p>
                  </Link>
                </div>
              )}
            </div>
          </Card>

          {/* Provider info */}
          <Card className="p-6 space-y-6">
            <h2 className="text-lg font-bold text-neutral-900 uppercase">Details techniques</h2>

            <div className="space-y-4">
              {log.providerMessageId && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Message ID</label>
                  <p className="text-neutral-900 font-mono text-sm break-all">{log.providerMessageId}</p>
                </div>
              )}

              {log.errorCode && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Code erreur</label>
                  <p className="text-red-600 font-mono">{log.errorCode}</p>
                </div>
              )}

              {log.errorMessage && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Message d'erreur</label>
                  <div className="mt-1 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-red-700 text-sm">{log.errorMessage}</p>
                  </div>
                </div>
              )}

              {log.providerResponse && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Reponse provider</label>
                  <pre className="mt-1 p-3 bg-neutral-50 rounded-lg border border-neutral-200 text-xs overflow-x-auto">
                    {JSON.stringify(log.providerResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Manual status update */}
        <Card className="p-6">
          <h2 className="text-lg font-bold text-neutral-900 uppercase mb-4">Mise a jour manuelle</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Mettez a jour le statut manuellement si necessaire (ex: apres verification d'un bounce)
          </p>

          <form onSubmit={handleUpdateStatus} className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Statut</label>
              <select
                value={form.data.status}
                onChange={(e) => form.setData('status', e.target.value as EmailLog['status'])}
                className="px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="pending">En attente</option>
                <option value="sent">Envoye</option>
                <option value="failed">Echec</option>
                <option value="bounced">Rejete (bounce)</option>
                <option value="complained">Signale spam</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Message d'erreur (optionnel)</label>
              <input
                type="text"
                value={form.data.errorMessage}
                onChange={(e) => form.setData('errorMessage', e.target.value)}
                placeholder="Ex: Mailbox full, Invalid address..."
                className="w-full px-4 py-2 border border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <Button type="submit" disabled={form.processing}>
              {form.processing ? 'Mise a jour...' : 'Mettre a jour'}
            </Button>
          </form>
        </Card>
      </div>
    </AdminLayout>
  )
}
