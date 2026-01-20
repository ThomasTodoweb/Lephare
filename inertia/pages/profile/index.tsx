import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { RHYTHM_LABELS, TYPE_LABELS } from '~/lib/constants'
import { usePushNotifications } from '~/hooks/use_push_notifications'
import { usePWAInstall } from '~/hooks/use_pwa_install'

interface Props {
  user: {
    email: string
    createdAt: string
  }
  restaurant: {
    name: string
    type: string
    publicationRhythm: string | null
    onboardingCompleted: boolean
  } | null
  strategy: {
    id: number
    name: string
    icon: string
  } | null
  instagram: {
    username: string
    profilePictureUrl?: string
    status: 'connected' | 'disconnected' | 'error'
  } | null
  subscription: {
    planType: string
    status: string
    trialDaysRemaining: number | null
  } | null
  streak: {
    currentStreak: number
    longestStreak: number
  }
}

export default function Profile({ user, restaurant, strategy, instagram, subscription, streak }: Props) {
  const disconnectForm = useForm({})
  const reconnectForm = useForm({})
  const logoutForm = useForm({})
  const restartOnboardingForm = useForm({})
  const [selectedTime, setSelectedTime] = useState('10:00')
  const {
    isSupported,
    isSubscribed,
    isLoading: notifLoading,
    error: notifError,
    subscribe,
    unsubscribe,
    updateReminderTime,
  } = usePushNotifications()

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()

  const handleDisconnectInstagram = () => {
    if (confirm('Voulez-vous vraiment déconnecter votre compte Instagram ?')) {
      disconnectForm.post('/profile/instagram/disconnect')
    }
  }

  const handleReconnectInstagram = () => {
    window.location.href = '/instagram/connect'
  }

  const handleLogout = () => {
    logoutForm.post('/logout')
  }

  const handleNotificationToggle = async () => {
    if (isSubscribed) {
      await unsubscribe()
    } else {
      await subscribe(selectedTime)
    }
  }

  const handleTimeChange = async (newTime: string) => {
    setSelectedTime(newTime)
    if (isSubscribed) {
      await updateReminderTime(newTime)
    }
  }

  const handleRestartOnboarding = () => {
    restartOnboardingForm.post('/profile/restart-onboarding')
  }

  return (
    <AppLayout currentPage="profile">
      <Head title="Mon profil - Le Phare" />
      {/* Header */}
      <div className="pt-4 pb-4">
        <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
          Mon profil
        </h1>
      </div>

      {/* Content */}
      <div className="pb-8 space-y-6">
          {/* Subscription card */}
          <Link href="/subscription" className="block">
            <Card className="hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-4">
                <span className="text-3xl">💳</span>
                <div className="flex-1">
                  <p className="font-bold text-neutral-900">Abonnement</p>
                  <p className="text-sm text-neutral-500">
                    {subscription?.status === 'trialing'
                      ? `Période d'essai (${subscription.trialDaysRemaining} jours restants)`
                      : subscription?.status === 'active'
                      ? 'Abonnement actif'
                      : 'Gérer mon abonnement'}
                  </p>
                </div>
                <span className="text-neutral-400">→</span>
              </div>
            </Card>
          </Link>

          {/* Streak Info */}
          {streak && streak.currentStreak > 0 && (
            <Card className="bg-primary/5 border-primary">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🔥</span>
                <div>
                  <p className="font-bold text-primary">{streak.currentStreak} jours de suite !</p>
                  <p className="text-sm text-neutral-600">
                    Record : {streak.longestStreak} jours
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Account info */}
          <Card>
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Compte</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Membre depuis</span>
                <span className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </Card>

          {/* Restaurant info */}
          {restaurant && (
            <Card>
              <h2 className="font-bold text-lg text-neutral-900 mb-4">Mon restaurant</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Nom</span>
                  <span className="font-medium">{restaurant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Type</span>
                  <span className="font-medium">{TYPE_LABELS[restaurant.type] || restaurant.type}</span>
                </div>
                {restaurant.publicationRhythm && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Rythme de publication</span>
                    <span className="font-medium">
                      {RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Configuration / Onboarding */}
          {restaurant && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-neutral-900">Configuration</h2>
                {restaurant.onboardingCompleted && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Terminee
                  </span>
                )}
              </div>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Strategie</span>
                  {strategy ? (
                    <span className="font-medium flex items-center gap-1">
                      <span>{strategy.icon}</span>
                      {strategy.name}
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">Non definie</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-600">Rythme</span>
                  {restaurant.publicationRhythm ? (
                    <span className="font-medium">
                      {RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm}
                    </span>
                  ) : (
                    <span className="text-neutral-400 italic">Non defini</span>
                  )}
                </div>
              </div>
              <Button
                variant="outlined"
                onClick={handleRestartOnboarding}
                disabled={restartOnboardingForm.processing}
                className="w-full"
              >
                {restartOnboardingForm.processing ? 'Chargement...' : 'Modifier ma configuration'}
              </Button>
            </Card>
          )}

          {/* Instagram connection */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-neutral-900">Instagram</h2>
              {instagram && (
                <div className="flex items-center gap-2">
                  {instagram.profilePictureUrl ? (
                    <img
                      src={instagram.profilePictureUrl}
                      alt={instagram.username}
                      className="w-8 h-8 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    </div>
                  )}
                  <span className="text-sm font-medium text-neutral-700">@{instagram.username}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      instagram.status === 'connected'
                        ? 'bg-green-500'
                        : instagram.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-yellow-500'
                    }`}
                    title={
                      instagram.status === 'connected'
                        ? 'Connecté'
                        : instagram.status === 'error'
                          ? 'Erreur'
                          : 'Déconnecté'
                    }
                  />
                </div>
              )}
            </div>
            {instagram ? (
              <Link href="/settings/instagram">
                <Button variant="outlined" className="w-full">
                  Gérer Instagram
                </Button>
              </Link>
            ) : (
              <div className="space-y-3">
                <p className="text-neutral-600 text-sm">
                  Aucun compte Instagram connecté
                </p>
                <Link href="/settings/instagram">
                  <Button className="w-full">
                    Connecter Instagram
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* PWA Install */}
          {(isInstallable || isIOS) && !isInstalled && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <div className="flex items-center gap-4">
                <span className="text-3xl">📲</span>
                <div className="flex-1">
                  <p className="font-bold text-neutral-900">Installer l'application</p>
                  <p className="text-sm text-neutral-600">
                    {isIOS
                      ? "Appuie sur Partager puis 'Sur l'écran d'accueil'"
                      : "Ajoute Le Phare à ton écran d'accueil"}
                  </p>
                </div>
                {!isIOS && (
                  <Button onClick={install} size="sm">
                    Installer
                  </Button>
                )}
              </div>
            </Card>
          )}

          {isInstalled && (
            <Card className="bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="font-medium text-green-800">Application installée</p>
              </div>
            </Card>
          )}

          {/* Notifications */}
          {isSupported && (
            <Card>
              <h2 className="font-bold text-lg text-neutral-900 mb-4">Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Rappels quotidiens</p>
                    <p className="text-sm text-neutral-500">
                      {isSubscribed ? 'Activés' : 'Désactivés'}
                    </p>
                  </div>
                  <button
                    onClick={handleNotificationToggle}
                    disabled={notifLoading}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isSubscribed ? 'bg-primary' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        isSubscribed ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </div>

                {isSubscribed && (
                  <div>
                    <label className="block text-sm text-neutral-600 mb-2">
                      Heure de rappel
                    </label>
                    <select
                      value={selectedTime}
                      onChange={(e) => handleTimeChange(e.target.value)}
                      className="w-full p-2 border border-neutral-200 rounded-lg"
                    >
                      <option value="08:00">08:00</option>
                      <option value="09:00">09:00</option>
                      <option value="10:00">10:00</option>
                      <option value="11:00">11:00</option>
                      <option value="12:00">12:00</option>
                      <option value="14:00">14:00</option>
                      <option value="16:00">16:00</option>
                      <option value="18:00">18:00</option>
                    </select>
                  </div>
                )}

                {notifError && (
                  <p className="text-sm text-red-500">{notifError}</p>
                )}
              </div>
            </Card>
          )}

        {/* Logout */}
        <Button
          variant="outlined"
          onClick={handleLogout}
          disabled={logoutForm.processing}
          className="w-full"
        >
          Déconnexion
        </Button>
      </div>
    </AppLayout>
  )
}
