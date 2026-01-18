import { Head, Link } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button } from '~/components/ui'

interface User {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: string
  updatedAt: string | null
  restaurant?: {
    id: number
    name: string | null
    type: string | null
    city: string | null
    strategyId: number | null
    weeklyRhythm: number | null
  } | null
  instagramConnection?: {
    id: number
    instagramUsername: string | null
    isConnected: boolean
  } | null
}

interface Stats {
  missionsCompleted: number
  missionsTotal: number
  tutorialsCompleted: number
  currentStreak: number
  longestStreak: number
}

interface Subscription {
  id: number
  planType: string
  status: string
  currentPeriodEnd: string | null
  trialEndsAt: string | null
  canceledAt: string | null
}

interface Mission {
  id: number
  status: string
  createdAt: string
  completedAt: string | null
  missionTemplate?: {
    id: number
    title: string
    type: string
  } | null
}

interface Props {
  user: User
  stats: Stats
  subscription: Subscription | null
  recentMissions: Mission[]
}

function formatDate(timestamp: string | null): string {
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
    pending: 'bg-yellow-100 text-yellow-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    skipped: 'bg-neutral-100 text-neutral-500',
    abandoned: 'bg-red-100 text-red-700',
  }

  const labels: Record<string, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminée',
    skipped: 'Passée',
    abandoned: 'Abandonnée',
  }

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${styles[status] || 'bg-neutral-100'}`}>
      {labels[status] || status}
    </span>
  )
}

function SubscriptionStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    trialing: 'bg-blue-100 text-blue-700',
    canceled: 'bg-red-100 text-red-700',
    past_due: 'bg-yellow-100 text-yellow-700',
  }

  const labels: Record<string, string> = {
    active: 'Actif',
    trialing: 'Période d\'essai',
    canceled: 'Annulé',
    past_due: 'Paiement en retard',
  }

  return (
    <span className={`px-3 py-1 text-sm rounded-full ${styles[status] || 'bg-neutral-100'}`}>
      {labels[status] || status}
    </span>
  )
}

export default function AdminUserShow({ user, stats, subscription, recentMissions }: Props) {
  return (
    <AdminLayout title={`Utilisateur: ${user.fullName || user.email}`}>
      <Head title={`${user.fullName || user.email} - Admin Le Phare`} />

      {/* Back link */}
      <Link href="/admin/users" className="text-primary text-sm mb-4 inline-block">
        ← Retour à la liste
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* User info card */}
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-neutral-900">
                  {user.fullName || 'Sans nom'}
                </h2>
                <p className="text-neutral-500">{user.email}</p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {user.role === 'admin' ? 'Admin' : 'Utilisateur'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-neutral-500">Inscrit le</p>
                <p className="font-medium">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <p className="text-neutral-500">Dernière activité</p>
                <p className="font-medium">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </Card>

          {/* Restaurant info */}
          {user.restaurant && (
            <Card>
              <h3 className="font-bold text-lg text-neutral-900 mb-4">Restaurant</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-neutral-500">Nom</p>
                  <p className="font-medium">{user.restaurant.name || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Type</p>
                  <p className="font-medium">{user.restaurant.type || 'Non renseigné'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Ville</p>
                  <p className="font-medium">{user.restaurant.city || 'Non renseignée'}</p>
                </div>
                <div>
                  <p className="text-neutral-500">Rythme hebdo</p>
                  <p className="font-medium">
                    {user.restaurant.weeklyRhythm
                      ? `${user.restaurant.weeklyRhythm}x/semaine`
                      : 'Non défini'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Instagram connection */}
          {user.instagramConnection && (
            <Card>
              <h3 className="font-bold text-lg text-neutral-900 mb-4">Instagram</h3>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 flex items-center justify-center text-white text-xl">
                  📷
                </div>
                <div>
                  <p className="font-medium">
                    @{user.instagramConnection.instagramUsername || 'Non connecté'}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {user.instagramConnection.isConnected ? 'Connecté' : 'Non connecté'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Recent missions */}
          <Card>
            <h3 className="font-bold text-lg text-neutral-900 mb-4">Missions récentes</h3>
            {recentMissions.length > 0 ? (
              <div className="space-y-3">
                {recentMissions.map((mission) => (
                  <div
                    key={mission.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {mission.missionTemplate?.title || `Mission #${mission.id}`}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {mission.missionTemplate?.type || 'Type inconnu'} •{' '}
                        {formatDate(mission.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={mission.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-500 py-8">Aucune mission</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats card */}
          <Card>
            <h3 className="font-bold text-lg text-neutral-900 mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Missions complétées</span>
                <span className="font-bold text-lg">
                  {stats.missionsCompleted}/{stats.missionsTotal}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Tutoriels</span>
                <span className="font-bold text-lg">{stats.tutorialsCompleted}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Streak actuel</span>
                <span className="font-bold text-lg">{stats.currentStreak}j 🔥</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500">Record streak</span>
                <span className="font-bold text-lg">{stats.longestStreak}j</span>
              </div>
            </div>
          </Card>

          {/* Subscription card */}
          <Card>
            <h3 className="font-bold text-lg text-neutral-900 mb-4">Abonnement</h3>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Statut</span>
                  <SubscriptionStatusBadge status={subscription.status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Plan</span>
                  <span className="font-medium capitalize">{subscription.planType}</span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Renouvellement</span>
                    <span className="font-medium">
                      {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                )}
                {subscription.trialEndsAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Fin trial</span>
                    <span className="font-medium">{formatDate(subscription.trialEndsAt)}</span>
                  </div>
                )}
                {subscription.canceledAt && (
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Annulé le</span>
                    <span className="font-medium text-red-600">
                      {formatDate(subscription.canceledAt)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-neutral-500 py-4">Aucun abonnement</p>
            )}
          </Card>

          {/* Actions */}
          <Card>
            <h3 className="font-bold text-lg text-neutral-900 mb-4">Actions</h3>
            <div className="space-y-2">
              <Button variant="outlined" className="w-full" disabled>
                Envoyer un email
              </Button>
              <Button variant="outlined" className="w-full" disabled>
                Réinitialiser mot de passe
              </Button>
              <Button
                variant="outlined"
                className="w-full text-red-600 border-red-600 hover:bg-red-50"
                disabled
              >
                Suspendre le compte
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
