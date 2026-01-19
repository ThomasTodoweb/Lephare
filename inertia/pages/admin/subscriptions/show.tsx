import { Head, Link, router } from '@inertiajs/react'
import { useState } from 'react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface Subscription {
  id: number
  userId: number
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  planType: 'free_trial' | 'monthly' | 'yearly'
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
  trialEndsAt: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: number
    email: string
    fullName: string | null
    restaurant?: {
      name: string
      type: string
    } | null
  }
}

interface Props {
  subscription: Subscription
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
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[status] || 'bg-neutral-100'}`}>
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
    free_trial: 'Essai gratuit',
    monthly: 'Mensuel (29 EUR/mois)',
    yearly: 'Annuel (290 EUR/an)',
  }

  return (
    <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[planType] || 'bg-neutral-100'}`}>
      {labels[planType] || planType}
    </span>
  )
}

function ActionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-4">
      <h4 className="font-medium text-neutral-900">{title}</h4>
      <p className="text-sm text-neutral-500 mt-1 mb-4">{description}</p>
      {children}
    </Card>
  )
}

export default function AdminSubscriptionShow({ subscription }: Props) {
  const [extendDays, setExtendDays] = useState(7)
  const [grantMonths, setGrantMonths] = useState(1)
  const [grantReason, setGrantReason] = useState('')
  const [revokeReason, setRevokeReason] = useState('')
  const [reactivateMonths, setReactivateMonths] = useState(1)
  const [loading, setLoading] = useState<string | null>(null)

  const isStripeManaged = !!subscription.stripeSubscriptionId

  const handleExtendTrial = async () => {
    if (loading) return
    setLoading('extend')
    router.post(
      `/admin/subscriptions/${subscription.id}/extend-trial`,
      { days: extendDays },
      {
        preserveState: true,
        onFinish: () => setLoading(null),
      }
    )
  }

  const handleGrantPremium = async () => {
    if (loading) return
    setLoading('grant')
    router.post(
      `/admin/subscriptions/${subscription.id}/grant-premium`,
      { months: grantMonths, reason: grantReason },
      {
        preserveState: true,
        onFinish: () => setLoading(null),
      }
    )
  }

  const handleRevoke = async () => {
    if (loading) return
    if (!confirm('Etes-vous sur de vouloir revoquer cet abonnement ?')) return
    setLoading('revoke')
    router.post(
      `/admin/subscriptions/${subscription.id}/revoke`,
      { reason: revokeReason },
      {
        preserveState: true,
        onFinish: () => setLoading(null),
      }
    )
  }

  const handleReactivate = async () => {
    if (loading) return
    setLoading('reactivate')
    router.post(
      `/admin/subscriptions/${subscription.id}/reactivate`,
      { months: reactivateMonths },
      {
        preserveState: true,
        onFinish: () => setLoading(null),
      }
    )
  }

  return (
    <AdminLayout title="Detail abonnement">
      <Head title={`Abonnement #${subscription.id} - Admin Le Phare`} />

      {/* Back link */}
      <Link
        href="/admin/subscriptions"
        className="inline-flex items-center text-neutral-500 hover:text-neutral-700 mb-6"
      >
        <span className="mr-2">←</span> Retour aux abonnements
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Subscription info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Utilisateur</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Nom</p>
                <p className="font-medium">{subscription.user.fullName || 'Non renseigne'}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium">{subscription.user.email}</p>
              </div>
              {subscription.user.restaurant && (
                <>
                  <div>
                    <p className="text-sm text-neutral-500">Restaurant</p>
                    <p className="font-medium">{subscription.user.restaurant.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500">Type</p>
                    <p className="font-medium capitalize">{subscription.user.restaurant.type}</p>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4">
              <Link
                href={`/admin/users/${subscription.userId}`}
                className="text-primary hover:text-primary/80 text-sm font-medium"
              >
                Voir le profil utilisateur →
              </Link>
            </div>
          </Card>

          {/* Subscription info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Abonnement</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Plan</p>
                <div className="mt-1">
                  <PlanBadge planType={subscription.planType} />
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Statut</p>
                <div className="mt-1">
                  <StatusBadge status={subscription.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Debut periode</p>
                <p className="font-medium">{formatDateTime(subscription.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Fin periode</p>
                <p className="font-medium">{formatDateTime(subscription.currentPeriodEnd)}</p>
              </div>
              {subscription.status === 'trialing' && (
                <div>
                  <p className="text-sm text-neutral-500">Fin du trial</p>
                  <p className="font-medium">{formatDateTime(subscription.trialEndsAt)}</p>
                </div>
              )}
              {subscription.canceledAt && (
                <div>
                  <p className="text-sm text-neutral-500">Annule le</p>
                  <p className="font-medium text-red-600">
                    {formatDateTime(subscription.canceledAt)}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Stripe info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Stripe</h3>
            {isStripeManaged ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-neutral-500">Customer ID</p>
                  <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                    {subscription.stripeCustomerId}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Subscription ID</p>
                  <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                    {subscription.stripeSubscriptionId}
                  </code>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Price ID</p>
                  <code className="text-sm bg-neutral-100 px-2 py-1 rounded">
                    {subscription.stripePriceId || '-'}
                  </code>
                </div>
                <p className="text-sm text-amber-600 mt-4">
                  Cet abonnement est gere par Stripe. Utilisez le Dashboard Stripe pour les modifications.
                </p>
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500">
                <p>Abonnement gere manuellement (non lie a Stripe)</p>
              </div>
            )}
          </Card>

          {/* Timestamps */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Historique</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Cree le</p>
                <p className="font-medium">{formatDateTime(subscription.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Mis a jour le</p>
                <p className="font-medium">{formatDateTime(subscription.updatedAt)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right column - Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Actions admin</h3>

          {/* Extend trial (only for trialing) */}
          {subscription.status === 'trialing' && (
            <ActionCard
              title="Prolonger le trial"
              description="Ajouter des jours supplementaires au trial"
            >
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={extendDays}
                  onChange={(e) => setExtendDays(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="py-2 text-neutral-500">jours</span>
                <Button
                  onClick={handleExtendTrial}
                  disabled={loading === 'extend'}
                  className="flex-1"
                >
                  {loading === 'extend' ? '...' : 'Prolonger'}
                </Button>
              </div>
            </ActionCard>
          )}

          {/* Grant premium */}
          <ActionCard
            title="Offrir Premium"
            description="Donner un acces premium gratuit"
          >
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={grantMonths}
                  onChange={(e) => setGrantMonths(Number(e.target.value))}
                  className="w-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <span className="py-2 text-neutral-500">mois</span>
              </div>
              <input
                type="text"
                placeholder="Raison (optionnel)"
                value={grantReason}
                onChange={(e) => setGrantReason(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <Button
                onClick={handleGrantPremium}
                disabled={loading === 'grant'}
                className="w-full"
                variant="secondary"
              >
                {loading === 'grant' ? '...' : 'Offrir Premium'}
              </Button>
            </div>
          </ActionCard>

          {/* Revoke (only for active/trialing) */}
          {(subscription.status === 'active' || subscription.status === 'trialing') && (
            <ActionCard
              title="Revoquer"
              description="Annuler immediatement l'abonnement"
            >
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Raison (optionnel)"
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Button
                  onClick={handleRevoke}
                  disabled={loading === 'revoke'}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {loading === 'revoke' ? '...' : 'Revoquer'}
                </Button>
              </div>
            </ActionCard>
          )}

          {/* Reactivate (only for canceled, non-Stripe) */}
          {subscription.status === 'canceled' && !isStripeManaged && (
            <ActionCard
              title="Reactiver"
              description="Reactiver un abonnement annule"
            >
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={reactivateMonths}
                    onChange={(e) => setReactivateMonths(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <span className="py-2 text-neutral-500">mois</span>
                </div>
                <Button
                  onClick={handleReactivate}
                  disabled={loading === 'reactivate'}
                  className="w-full"
                >
                  {loading === 'reactivate' ? '...' : 'Reactiver'}
                </Button>
              </div>
            </ActionCard>
          )}

          {/* Warning for Stripe-managed */}
          {isStripeManaged && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-sm text-amber-700">
                <strong>Attention:</strong> Cet abonnement est gere par Stripe. Les modifications
                de facturation doivent etre faites dans le Dashboard Stripe.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
