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
import { ChevronRight, LogOut } from 'lucide-react'

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

      {/* Flash messages */}
      {flash?.success && <Toast message={flash.success} type="success" />}
      {flash?.error && <Toast message={flash.error} type="error" />}

      {/* Header */}
      <div className="pt-6 pb-2">
        <h1 className="text-[22px] font-semibold text-text">Mon profil</h1>
      </div>

      <div className="pb-8 space-y-6">
        {/* Section 1: Account */}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Compte
          </p>
          <Card variant="bordered">
            {/* Level Progress */}
            <div className="mb-4 pb-4 border-b border-border">
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

            {/* Email */}
            {editingField === 'email' ? (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <label className="block">
                  <span className="text-[13px] text-text-secondary">Email</span>
                  <input
                    type="email"
                    value={emailForm.data.email}
                    onChange={(e) => emailForm.setData('email', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-text/20 focus:border-text/30"
                    autoFocus
                  />
                </label>
                {emailForm.errors.email && (
                  <p className="text-[13px] text-red-500">{emailForm.errors.email}</p>
                )}
                <div className="flex gap-2">
                  <Button type="submit" size="sm" loading={emailForm.processing}>
                    Enregistrer
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[13px] text-text-secondary block">Email</span>
                  <span className="text-[14px] font-medium text-text">{user.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingField('email')}
                  className="text-[13px] text-text-secondary hover:text-text transition-colors"
                >
                  Modifier
                </button>
              </div>
            )}

            {/* Member since */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <span className="text-[13px] text-text-secondary">Membre depuis</span>
              <span className="text-[14px] font-medium text-text">
                {new Date(user.createdAt).toLocaleDateString('fr-FR')}
              </span>
            </div>
          </Card>
        </div>

        {/* Section 2: Restaurant */}
        {restaurant && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Restaurant
            </p>
            <Card variant="bordered">
              <div className="space-y-0">
                {/* Restaurant Name */}
                {editingField === 'name' ? (
                  <form onSubmit={handleNameSubmit} className="space-y-3">
                    <label className="block">
                      <span className="text-[13px] text-text-secondary">Nom du restaurant</span>
                      <input
                        type="text"
                        value={nameForm.data.name}
                        onChange={(e) => nameForm.setData('name', e.target.value)}
                        className="w-full mt-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-text/20 focus:border-text/30"
                        autoFocus
                      />
                    </label>
                    {nameForm.errors.name && (
                      <p className="text-[13px] text-red-500">{nameForm.errors.name}</p>
                    )}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" loading={nameForm.processing}>
                        Enregistrer
                      </Button>
                      <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[13px] text-text-secondary block">Nom</span>
                      <span className="text-[14px] font-medium text-text">{restaurant.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingField('name')}
                      className="text-[13px] text-text-secondary hover:text-text transition-colors"
                    >
                      Modifier
                    </button>
                  </div>
                )}

                {/* Restaurant Type */}
                <div className="mt-4 pt-4 border-t border-border">
                  {editingField === 'type' ? (
                    <form onSubmit={handleTypeSubmit} className="space-y-3">
                      <label className="block">
                        <span className="text-[13px] text-text-secondary">Type de restaurant</span>
                        <select
                          value={typeForm.data.type}
                          onChange={(e) => typeForm.setData('type', e.target.value)}
                          className="w-full mt-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-text/20 focus:border-text/30"
                        >
                          {restaurantTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      {typeForm.errors.type && (
                        <p className="text-[13px] text-red-500">{typeForm.errors.type}</p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={typeForm.processing}>
                          Enregistrer
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[13px] text-text-secondary block">Type</span>
                        <span className="text-[14px] font-medium text-text">
                          {TYPE_LABELS[restaurant.type] || restaurant.type}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingField('type')}
                        className="text-[13px] text-text-secondary hover:text-text transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>

                {/* Publication Rhythm */}
                <div className="mt-4 pt-4 border-t border-border">
                  {editingField === 'rhythm' ? (
                    <form onSubmit={handleRhythmSubmit} className="space-y-3">
                      <label className="block">
                        <span className="text-[13px] text-text-secondary">Rythme de publication</span>
                        <select
                          value={rhythmForm.data.publication_rhythm}
                          onChange={(e) => rhythmForm.setData('publication_rhythm', e.target.value)}
                          className="w-full mt-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-text/20 focus:border-text/30"
                        >
                          {publicationRhythms.map((rhythm) => (
                            <option key={rhythm.value} value={rhythm.value}>
                              {rhythm.label} - {rhythm.description}
                            </option>
                          ))}
                        </select>
                      </label>
                      {rhythmForm.errors.publication_rhythm && (
                        <p className="text-[13px] text-red-500">{rhythmForm.errors.publication_rhythm}</p>
                      )}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" loading={rhythmForm.processing}>
                          Enregistrer
                        </Button>
                        <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                          Annuler
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[13px] text-text-secondary block">Rythme</span>
                        <span className="text-[14px] font-medium text-text">
                          {restaurant.publicationRhythm
                            ? RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm
                            : 'Non défini'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingField('rhythm')}
                        className="text-[13px] text-text-secondary hover:text-text transition-colors"
                      >
                        Modifier
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Section 3: Strategy */}
        {restaurant && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Objectif
            </p>
            <Card variant="bordered">
              {editingField === 'strategy' ? (
                <form onSubmit={handleStrategySubmit} className="space-y-3">
                  <label className="block">
                    <span className="text-[13px] text-text-secondary">Choisir un objectif</span>
                    <select
                      value={strategyForm.data.strategy_id}
                      onChange={(e) => strategyForm.setData('strategy_id', Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2.5 bg-bg-subtle border border-border rounded-xl text-[14px] text-text focus:outline-none focus:ring-2 focus:ring-text/20 focus:border-text/30"
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
                    <p className="text-[13px] text-red-500">{strategyForm.errors.strategy_id}</p>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={strategyForm.processing || strategyForm.data.strategy_id === 0} loading={strategyForm.processing}>
                      Enregistrer
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={cancelEdit}>
                      Annuler
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[13px] text-text-secondary block">Objectif actuel</span>
                    {strategy ? (
                      <span className="text-[14px] font-medium text-text flex items-center gap-1.5">
                        <span>{strategy.icon}</span>
                        {strategy.name}
                      </span>
                    ) : (
                      <span className="text-[14px] text-text-muted italic">Non défini</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      strategyForm.setData('strategy_id', strategy?.id || 0)
                      setEditingField('strategy')
                    }}
                    className="text-[13px] text-text-secondary hover:text-text transition-colors"
                  >
                    Modifier
                  </button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Section 4: Instagram */}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Instagram
          </p>
          <Card variant="bordered">
            {instagram ? (
              <Link href="/settings/instagram" className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {instagram.profilePictureUrl ? (
                    <img
                      src={instagram.profilePictureUrl}
                      alt={instagram.username}
                      className="w-9 h-9 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <span className="text-[14px] font-medium text-text block">@{instagram.username}</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          instagram.status === 'connected'
                            ? 'bg-green-500'
                            : instagram.status === 'error'
                              ? 'bg-red-500'
                              : 'bg-yellow-500'
                        }`}
                      />
                      <span className="text-[12px] text-text-muted">
                        {instagram.status === 'connected'
                          ? 'Connecté'
                          : instagram.status === 'error'
                            ? 'Erreur'
                            : 'Déconnecté'}
                      </span>
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </Link>
            ) : (
              <Link href="/settings/instagram" className="flex items-center justify-between">
                <span className="text-[14px] text-text-secondary">Connecter Instagram</span>
                <ChevronRight size={16} className="text-text-muted" />
              </Link>
            )}
          </Card>
        </div>

        {/* Section 5: Notifications + Emails */}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Notifications
          </p>
          <Card variant="bordered">
            <div className="space-y-0">
              {/* Push notifications */}
              {isSupported && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium text-text">Rappels quotidiens</p>
                      <p className="text-[12px] text-text-muted">{isSubscribed ? 'Activés' : 'Désactivés'}</p>
                    </div>
                    <button
                      onClick={handleNotificationToggle}
                      disabled={notifLoading}
                      className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                        isSubscribed ? 'bg-text' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform shadow-sm ${
                          isSubscribed ? 'translate-x-[20px]' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {isSubscribed && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <label className="flex items-center justify-between">
                        <span className="text-[13px] text-text-secondary">Heure de rappel</span>
                        <select
                          value={selectedTime}
                          onChange={(e) => handleTimeChange(e.target.value)}
                          className="px-3 py-1.5 bg-bg-subtle border border-border rounded-lg text-[13px] text-text focus:outline-none"
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
                      </label>
                    </div>
                  )}

                  {notifError && <p className="text-[12px] text-red-500 mt-2">{notifError}</p>}

                  <div className="my-4 border-t border-border" />
                </>
              )}

              {/* Email: Daily Mission */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text">Mission quotidienne</p>
                  <p className="text-[12px] text-text-muted">Rappel par email</p>
                </div>
                <button
                  onClick={() => updateEmailPreference('dailyMission', !emailDailyMission)}
                  disabled={emailPrefLoading}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    emailDailyMission ? 'bg-text' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform shadow-sm ${
                      emailDailyMission ? 'translate-x-[20px]' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Email: Weekly Summary */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[14px] font-medium text-text">Bilan hebdomadaire</p>
                  <p className="text-[12px] text-text-muted">Analyse IA de votre semaine</p>
                </div>
                <button
                  onClick={() => updateEmailPreference('weeklySummary', !emailWeeklySummary)}
                  disabled={emailPrefLoading}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    emailWeeklySummary ? 'bg-text' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform shadow-sm ${
                      emailWeeklySummary ? 'translate-x-[20px]' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Email: Account Changes */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <div>
                  <p className="text-[14px] font-medium text-text">Modifications du compte</p>
                  <p className="text-[12px] text-text-muted">Alertes de sécurité</p>
                </div>
                <button
                  onClick={() => updateEmailPreference('accountChanges', !emailAccountChanges)}
                  disabled={emailPrefLoading}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    emailAccountChanges ? 'bg-text' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] rounded-full bg-white transition-transform shadow-sm ${
                      emailAccountChanges ? 'translate-x-[20px]' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Section 6: Subscription */}
        <div>
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Abonnement
          </p>
          <Link href="/subscription" className="block">
            <Card variant="bordered">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text">Mon abonnement</p>
                  <p className="text-[12px] text-text-muted">
                    {subscription?.status === 'trialing'
                      ? `Période d'essai (${subscription.trialDaysRemaining}j restants)`
                      : subscription?.status === 'active'
                        ? 'Abonnement actif'
                        : 'Gérer mon abonnement'}
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </Card>
          </Link>
        </div>

        {/* Section 7: PWA Install */}
        {(isInstallable || isIOS) && !isInstalled && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Application
            </p>
            <Card variant="bordered">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] font-medium text-text">Installer l'application</p>
                  <p className="text-[12px] text-text-muted">
                    {isIOS
                      ? "Partager > Sur l'écran d'accueil"
                      : "Ajouter à l'écran d'accueil"}
                  </p>
                </div>
                {!isIOS && (
                  <Button onClick={install} size="sm">
                    Installer
                  </Button>
                )}
              </div>
            </Card>
          </div>
        )}

        {isInstalled && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Application
            </p>
            <Card variant="bordered">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <p className="text-[14px] text-text-secondary">Application installée</p>
              </div>
            </Card>
          </div>
        )}

        {/* Logout */}
        <div className="pt-2">
          <button
            onClick={handleLogout}
            disabled={logoutForm.processing}
            className="flex items-center gap-2 text-[14px] text-text-secondary hover:text-text transition-colors mx-auto"
          >
            <LogOut size={15} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
