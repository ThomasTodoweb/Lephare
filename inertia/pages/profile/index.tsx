import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { RHYTHM_LABELS, TYPE_LABELS } from '~/lib/constants'
import { usePushNotifications } from '~/hooks/use_push_notifications'
import { usePWAInstall } from '~/hooks/use_pwa_install'
import { LevelProgressBar } from '~/components/features/home/LevelProgressBar'

interface RestaurantType {
  value: string
  label: string
  icon: string
}

interface PublicationRhythm {
  value: string
  label: string
  description: string
}

interface StrategyOption {
  id: number
  name: string
  icon: string
  description: string
}

interface LevelInfo {
  xpTotal: number
  currentLevel: number
  levelName: string
  levelIcon: string
  xpForNextLevel: number
  xpProgressInLevel: number
  progressPercent: number
  isMaxLevel: boolean
}

interface Props {
  user: {
    email: string
    createdAt: string
  }
  level: LevelInfo
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
  restaurantTypes: RestaurantType[]
  publicationRhythms: PublicationRhythm[]
  strategies: StrategyOption[]
  notificationReminderTime: string
  emailPreferences: {
    dailyMission: boolean
    weeklySummary: boolean
    accountChanges: boolean
  }
}

type EditingField = 'email' | 'name' | 'type' | 'rhythm' | 'strategy' | null

export default function Profile({
  user,
  level,
  restaurant,
  strategy,
  instagram,
  subscription,
  streak,
  restaurantTypes,
  publicationRhythms,
  strategies,
  notificationReminderTime,
  emailPreferences,
}: Props) {
  const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props
  const [editingField, setEditingField] = useState<EditingField>(null)

  const disconnectForm = useForm({})
  const logoutForm = useForm({})

  const emailForm = useForm({ email: user.email })
  const nameForm = useForm({ name: restaurant?.name || '' })
  const typeForm = useForm({ type: restaurant?.type || '' })
  const rhythmForm = useForm({ publication_rhythm: restaurant?.publicationRhythm || '' })
  const strategyForm = useForm({ strategy_id: strategy?.id || 0 })

  const [selectedTime, setSelectedTime] = useState(notificationReminderTime || '10:00')
  const {
    isSupported,
    isSubscribed,
    isLoading: notifLoading,
    error: notifError,
    subscribe,
    unsubscribe,
    updateReminderTime,
  } = usePushNotifications(notificationReminderTime)

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall()

  // Email preferences state
  const [emailDailyMission, setEmailDailyMission] = useState(emailPreferences?.dailyMission ?? true)
  const [emailWeeklySummary, setEmailWeeklySummary] = useState(emailPreferences?.weeklySummary ?? true)
  const [emailAccountChanges, setEmailAccountChanges] = useState(emailPreferences?.accountChanges ?? true)
  const [emailPrefLoading, setEmailPrefLoading] = useState(false)

  const updateEmailPreference = async (key: 'dailyMission' | 'weeklySummary' | 'accountChanges', value: boolean) => {
    setEmailPrefLoading(true)
    try {
      const response = await fetch('/profile/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)![1]) : '',
        },
        body: JSON.stringify({ [key]: value }),
      })
      if (response.ok) {
        if (key === 'dailyMission') setEmailDailyMission(value)
        if (key === 'weeklySummary') setEmailWeeklySummary(value)
        if (key === 'accountChanges') setEmailAccountChanges(value)
      }
    } catch (error) {
      console.error('Failed to update email preference', error)
    } finally {
      setEmailPrefLoading(false)
    }
  }

  const handleDisconnectInstagram = () => {
    if (confirm('Voulez-vous vraiment déconnecter votre compte Instagram ?')) {
      disconnectForm.post('/profile/instagram/disconnect')
    }
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

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    emailForm.post('/profile/email', {
      onSuccess: () => setEditingField(null),
    })
  }

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nameForm.post('/profile/restaurant/name', {
      onSuccess: () => setEditingField(null),
    })
  }

  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    typeForm.post('/profile/restaurant/type', {
      onSuccess: () => setEditingField(null),
    })
  }

  const handleRhythmSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    rhythmForm.post('/profile/restaurant/rhythm', {
      onSuccess: () => setEditingField(null),
    })
  }

  const handleStrategySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    strategyForm.post('/profile/restaurant/strategy', {
      onSuccess: () => setEditingField(null),
    })
  }

  const cancelEdit = () => {
    setEditingField(null)
    emailForm.reset()
    nameForm.reset()
    typeForm.reset()
    rhythmForm.reset()
    strategyForm.reset()
  }

  return (
    <AppLayout>
      <Head title="Mon profil - Le Phare" />
      {/* Header */}
      <div className="pt-4 pb-4">
        <h1 className="text-2xl font-bolota font-bold text-neutral-900 uppercase">
          Mon profil
        </h1>
      </div>

      {/* Flash messages as toasts */}
      {flash?.success && <Toast message={flash.success} type="success" />}
      {flash?.error && <Toast message={flash.error} type="error" />}

      {/* Level Progress */}
      <div className="mb-6">
        <LevelProgressBar
          currentLevel={level.currentLevel}
          levelName={level.levelName}
          levelIcon={level.levelIcon}
          xpTotal={level.xpTotal}
          xpProgressInLevel={level.xpProgressInLevel}
          xpForNextLevel={level.xpForNextLevel}
          progressPercent={level.progressPercent}
          isMaxLevel={level.isMaxLevel}
        />
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

        {/* Account info */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Compte</h2>
          <div className="space-y-4">
            {/* Email */}
            {editingField === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Email</span>
                  <input
                    type="email"
                    value={emailForm.data.email}
                    onChange={(e) => emailForm.setData('email', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    autoFocus
                  />
                </label>
                {emailForm.errors.email && (
                  <p className="text-sm text-red-500">{emailForm.errors.email}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={emailForm.processing}>
                    {emailForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button type="button" variant="outlined" size="sm" onClick={cancelEdit}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-sm text-neutral-600 block">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField('email')}
                  className="text-primary text-sm font-medium hover:underline"
                >
                  Modifier
                </button>
              </div>
            )}

            {/* Member since */}
            <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
              <span className="text-sm text-neutral-600">Membre depuis</span>
              <span className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>
        </Card>

        {/* Restaurant info */}
        {restaurant && (
          <Card>
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Mon restaurant</h2>
            <div className="space-y-4">
              {/* Restaurant Name */}
              {editingField === 'name' ? (
                <form onSubmit={handleNameSubmit} className="space-y-3">
                  <label className="block">
                    <span className="text-sm text-neutral-600">Nom du restaurant</span>
                    <input
                      type="text"
                      value={nameForm.data.name}
                      onChange={(e) => nameForm.setData('name', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </label>
                  {nameForm.errors.name && (
                    <p className="text-sm text-red-500">{nameForm.errors.name}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={nameForm.processing}>
                      {nameForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button type="button" variant="outlined" size="sm" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-neutral-600 block">Nom</span>
                    <span className="font-medium">{restaurant.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField('name')}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              )}

              {/* Restaurant Type */}
              {editingField === 'type' ? (
                <form onSubmit={handleTypeSubmit} className="space-y-3 pt-2 border-t border-neutral-100">
                  <label className="block">
                    <span className="text-sm text-neutral-600">Type de restaurant</span>
                    <select
                      value={typeForm.data.type}
                      onChange={(e) => typeForm.setData('type', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {restaurantTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.icon} {type.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {typeForm.errors.type && (
                    <p className="text-sm text-red-500">{typeForm.errors.type}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={typeForm.processing}>
                      {typeForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button type="button" variant="outlined" size="sm" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-sm text-neutral-600 block">Type</span>
                    <span className="font-medium">{TYPE_LABELS[restaurant.type] || restaurant.type}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField('type')}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              )}

              {/* Publication Rhythm */}
              {editingField === 'rhythm' ? (
                <form onSubmit={handleRhythmSubmit} className="space-y-3 pt-2 border-t border-neutral-100">
                  <label className="block">
                    <span className="text-sm text-neutral-600">Rythme de publication</span>
                    <select
                      value={rhythmForm.data.publication_rhythm}
                      onChange={(e) => rhythmForm.setData('publication_rhythm', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {publicationRhythms.map((rhythm) => (
                        <option key={rhythm.value} value={rhythm.value}>
                          {rhythm.label} - {rhythm.description}
                        </option>
                      ))}
                    </select>
                  </label>
                  {rhythmForm.errors.publication_rhythm && (
                    <p className="text-sm text-red-500">{rhythmForm.errors.publication_rhythm}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={rhythmForm.processing}>
                      {rhythmForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button type="button" variant="outlined" size="sm" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                  <div>
                    <span className="text-sm text-neutral-600 block">Rythme de publication</span>
                    <span className="font-medium">
                      {restaurant.publicationRhythm
                        ? RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm
                        : 'Non défini'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingField('rhythm')}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Strategy / Objectif */}
        {restaurant && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-neutral-900">Objectif</h2>
              {restaurant.onboardingCompleted && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Configuré
                </span>
              )}
            </div>
            {editingField === 'strategy' ? (
              <form onSubmit={handleStrategySubmit} className="space-y-3">
                <label className="block">
                  <span className="text-sm text-neutral-600">Choisir un objectif</span>
                  <select
                    value={strategyForm.data.strategy_id}
                    onChange={(e) => strategyForm.setData('strategy_id', Number(e.target.value))}
                    className="w-full mt-1 px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                  >
                    <option value={0} disabled>Sélectionner un objectif</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </option>
                    ))}
                  </select>
                </label>
                {strategyForm.errors.strategy_id && (
                  <p className="text-sm text-red-500">{strategyForm.errors.strategy_id}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={strategyForm.processing || strategyForm.data.strategy_id === 0}>
                    {strategyForm.processing ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                  <Button type="button" variant="outlined" size="sm" onClick={cancelEdit}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-neutral-600 block">Objectif actuel</span>
                    {strategy ? (
                      <span className="font-medium flex items-center gap-1">
                        <span>{strategy.icon}</span>
                        {strategy.name}
                      </span>
                    ) : (
                      <span className="text-neutral-400 italic">Non défini</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      strategyForm.setData('strategy_id', strategy?.id || 0)
                      setEditingField('strategy')
                    }}
                    className="text-primary text-sm font-medium hover:underline"
                  >
                    Modifier
                  </button>
                </div>
              </div>
            )}
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
              <p className="text-neutral-600 text-sm">Aucun compte Instagram connecté</p>
              <Link href="/settings/instagram">
                <Button className="w-full">Connecter Instagram</Button>
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
                  <p className="text-sm text-neutral-500">{isSubscribed ? 'Activés' : 'Désactivés'}</p>
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
                  <label className="block text-sm text-neutral-600 mb-2">Heure de rappel</label>
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

              {notifError && <p className="text-sm text-red-500">{notifError}</p>}
            </div>
          </Card>
        )}

        {/* Email Preferences */}
        <Card>
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Emails</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Choisissez les emails que vous souhaitez recevoir
          </p>
          <div className="space-y-4">
            {/* Daily Mission Email */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Mission quotidienne</p>
                <p className="text-sm text-neutral-500">Rappel de votre mission du jour</p>
              </div>
              <button
                onClick={() => updateEmailPreference('dailyMission', !emailDailyMission)}
                disabled={emailPrefLoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailDailyMission ? 'bg-primary' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailDailyMission ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Weekly Summary Email */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <div>
                <p className="font-medium">Bilan hebdomadaire</p>
                <p className="text-sm text-neutral-500">Analyse IA de votre semaine (lundi matin)</p>
              </div>
              <button
                onClick={() => updateEmailPreference('weeklySummary', !emailWeeklySummary)}
                disabled={emailPrefLoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailWeeklySummary ? 'bg-primary' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailWeeklySummary ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>

            {/* Account Changes Email */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
              <div>
                <p className="font-medium">Modifications du compte</p>
                <p className="text-sm text-neutral-500">Alertes de changements sur votre profil</p>
              </div>
              <button
                onClick={() => updateEmailPreference('accountChanges', !emailAccountChanges)}
                disabled={emailPrefLoading}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  emailAccountChanges ? 'bg-primary' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    emailAccountChanges ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </Card>

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
