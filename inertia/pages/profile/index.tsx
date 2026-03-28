import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { useState } from 'react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Toast } from '~/components/ui/Toast'
import { RHYTHM_LABELS, TYPE_LABELS } from '~/lib/constants'
import { usePushNotifications } from '~/hooks/use_push_notifications'
import { usePWAInstall } from '~/hooks/use_pwa_install'
import {
  ChevronRight,
  LogOut,
  Target,
  Clock,
  Utensils,
  Bell,
  Download,
  CheckCircle,
} from 'lucide-react'

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
  const [emailPrefsExpanded, setEmailPrefsExpanded] = useState(false)

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
    if (confirm('Veux-tu vraiment déconnecter ton compte Instagram ?')) {
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

  // Computed values
  const daysOnApp = Math.max(1, Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
  const xpNext = level.xpProgressInLevel + level.xpForNextLevel
  const initials = restaurant?.name
    ? restaurant.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <AppLayout>
      <Head title="Mon profil - Le Phare" />

      {/* Flash messages */}
      {flash?.success && <Toast message={flash.success} type="success" />}
      {flash?.error && <Toast message={flash.error} type="error" />}

      <div className="pb-8 pt-4 animate-fade-up">
        {/* ===== ZONE 1: Carte de joueur ===== */}
        <div className="bg-bg-card border border-border rounded-2xl p-5 animate-fade-up">
          {/* Profile header */}
          <div className="flex items-center gap-3.5 mb-4">
            {instagram?.profilePictureUrl ? (
              <img
                src={instagram.profilePictureUrl}
                alt={restaurant?.name || 'Profil'}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-text flex items-center justify-center">
                <span className="text-[18px] font-bold text-white">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-[20px] font-bold text-text truncate">
                {restaurant?.name || 'Mon restaurant'}
              </h1>
              {restaurant?.type && (
                <p className="text-[13px] text-text-secondary">
                  {TYPE_LABELS[restaurant.type] || restaurant.type}
                </p>
              )}
              {instagram ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      instagram.status === 'connected'
                        ? 'bg-success'
                        : 'bg-error'
                    }`}
                  />
                  <span className="text-[12px] text-text-muted">@{instagram.username}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-error" />
                  <span className="text-[12px] text-text-muted">Instagram non connecté</span>
                </div>
              )}
            </div>
          </div>

          {/* Level progress bar */}
          <div className="mb-4">
            <div className="h-2 rounded-full bg-bg-subtle overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${level.progressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[12px] text-text-secondary">
                {level.isMaxLevel
                  ? 'Niveau max atteint'
                  : `Niveau ${level.currentLevel} — ${level.levelName}`}
              </span>
              {!level.isMaxLevel && (
                <span className="text-[12px] text-text-muted">
                  {level.xpProgressInLevel}/{xpNext} pts
                </span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-bg-subtle border border-border rounded-xl p-2.5 text-center">
              <p className="text-[16px] font-bold text-text">{streak.longestStreak}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Record</p>
            </div>
            <div className="bg-bg-subtle border border-border rounded-xl p-2.5 text-center">
              <p className="text-[16px] font-bold text-text">{streak.currentStreak}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Série en cours</p>
            </div>
            <div className="bg-bg-subtle border border-border rounded-xl p-2.5 text-center">
              <p className="text-[16px] font-bold text-text">{daysOnApp}</p>
              <p className="text-[11px] text-text-muted mt-0.5">Jours sur l'app</p>
            </div>
          </div>
        </div>

        {/* ===== ZONE 2: Réglages en pills ===== */}
        {restaurant && (
          <div className="mt-6">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2.5 px-1">
              Réglages
            </p>

            {editingField === null ? (
              <div className="flex flex-wrap gap-2">
                {/* Strategy pill */}
                <button
                  type="button"
                  onClick={() => {
                    strategyForm.setData('strategy_id', strategy?.id || 0)
                    setEditingField('strategy')
                  }}
                  className="bg-bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-2 text-left active:scale-[0.97] transition-transform"
                >
                  <Target size={15} className="text-text-muted shrink-0" />
                  <span className="text-[13px] font-medium text-text">
                    {strategy ? strategy.name : 'Objectif'}
                  </span>
                </button>

                {/* Rhythm pill */}
                <button
                  type="button"
                  onClick={() => setEditingField('rhythm')}
                  className="bg-bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-2 text-left active:scale-[0.97] transition-transform"
                >
                  <Clock size={15} className="text-text-muted shrink-0" />
                  <span className="text-[13px] font-medium text-text">
                    {restaurant.publicationRhythm
                      ? RHYTHM_LABELS[restaurant.publicationRhythm] || restaurant.publicationRhythm
                      : '3x/semaine'}
                  </span>
                </button>

                {/* Type pill */}
                <button
                  type="button"
                  onClick={() => setEditingField('type')}
                  className="bg-bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-2 text-left active:scale-[0.97] transition-transform"
                >
                  <Utensils size={15} className="text-text-muted shrink-0" />
                  <span className="text-[13px] font-medium text-text">
                    {TYPE_LABELS[restaurant.type] || restaurant.type}
                  </span>
                </button>

                {/* Notifications pill */}
                {isSupported && (
                  <button
                    type="button"
                    onClick={handleNotificationToggle}
                    disabled={notifLoading}
                    className="bg-bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-2 text-left active:scale-[0.97] transition-transform"
                  >
                    <Bell size={15} className="text-text-muted shrink-0" />
                    <span className="text-[13px] font-medium text-text">
                      {isSubscribed ? selectedTime : 'Désactivées'}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-bg-card border border-border rounded-2xl p-4">
                {/* Strategy editing */}
                {editingField === 'strategy' && (
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
                      <p className="text-[13px] text-error">{strategyForm.errors.strategy_id}</p>
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
                )}

                {/* Rhythm editing */}
                {editingField === 'rhythm' && (
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
                      <p className="text-[13px] text-error">{rhythmForm.errors.publication_rhythm}</p>
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
                )}

                {/* Type editing */}
                {editingField === 'type' && (
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
                      <p className="text-[13px] text-error">{typeForm.errors.type}</p>
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
                )}

                {/* Name editing */}
                {editingField === 'name' && (
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
                      <p className="text-[13px] text-error">{nameForm.errors.name}</p>
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
                )}

                {/* Email editing */}
                {editingField === 'email' && (
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
                      <p className="text-[13px] text-error">{emailForm.errors.email}</p>
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
                )}

                {/* Notification time editing (shown when subscribed and user taps pill) */}
                {notifError && <p className="text-[12px] text-error mt-2">{notifError}</p>}
              </div>
            )}

            {/* Notification time selector when subscribed */}
            {isSupported && isSubscribed && editingField === null && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[12px] text-text-muted">Rappel :</span>
                <select
                  value={selectedTime}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  className="px-2 py-1 bg-bg-subtle border border-border rounded-lg text-[12px] text-text focus:outline-none"
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
          </div>
        )}

        {/* ===== ZONE 3: Liens navigables ===== */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2.5 px-1">
            Compte
          </p>

          <div className="bg-bg-card border border-border rounded-2xl overflow-hidden">
            {/* Mon abonnement */}
            <Link
              href="/subscription"
              className="flex items-center justify-between py-3.5 px-4 border-b border-border"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-medium text-text">Mon abonnement</span>
                {subscription?.status === 'trialing' && (
                  <span className="bg-warning/10 text-warning text-[11px] font-semibold px-2 py-0.5 rounded-full">
                    Essai {subscription.trialDaysRemaining}j
                  </span>
                )}
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </Link>

            {/* Compte Instagram */}
            <Link
              href="/settings/instagram"
              className="flex items-center justify-between py-3.5 px-4 border-b border-border"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-medium text-text">Compte Instagram</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    instagram?.status === 'connected'
                      ? 'bg-success'
                      : 'bg-error'
                  }`}
                />
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </Link>

            {/* Préférences email */}
            <button
              type="button"
              onClick={() => setEmailPrefsExpanded(!emailPrefsExpanded)}
              className="w-full flex items-center justify-between py-3.5 px-4 border-b border-border text-left"
            >
              <span className="text-[14px] font-medium text-text">Préférences email</span>
              <ChevronRight
                size={16}
                className={`text-text-muted transition-transform ${emailPrefsExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {emailPrefsExpanded && (
              <div className="px-4 py-3 space-y-3 border-b border-border bg-bg-subtle/50">
                {/* Email: Daily Mission */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-text">Mission quotidienne</p>
                    <p className="text-[11px] text-text-muted">Rappel par email</p>
                  </div>
                  <button
                    onClick={() => updateEmailPreference('dailyMission', !emailDailyMission)}
                    disabled={emailPrefLoading}
                    className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                      emailDailyMission ? 'bg-text' : 'bg-bg-subtle'
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
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-[13px] font-medium text-text">Bilan hebdomadaire</p>
                    <p className="text-[11px] text-text-muted">Analyse IA de ta semaine</p>
                  </div>
                  <button
                    onClick={() => updateEmailPreference('weeklySummary', !emailWeeklySummary)}
                    disabled={emailPrefLoading}
                    className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                      emailWeeklySummary ? 'bg-text' : 'bg-bg-subtle'
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
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div>
                    <p className="text-[13px] font-medium text-text">Modifications du compte</p>
                    <p className="text-[11px] text-text-muted">Alertes de sécurité</p>
                  </div>
                  <button
                    onClick={() => updateEmailPreference('accountChanges', !emailAccountChanges)}
                    disabled={emailPrefLoading}
                    className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                      emailAccountChanges ? 'bg-text' : 'bg-bg-subtle'
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
            )}

            {/* Modifier email */}
            <button
              type="button"
              onClick={() => setEditingField('email')}
              className="w-full flex items-center justify-between py-3.5 px-4 border-b border-border text-left"
            >
              <div>
                <span className="text-[14px] font-medium text-text block">Email</span>
                <span className="text-[12px] text-text-muted">{user.email}</span>
              </div>
              <ChevronRight size={16} className="text-text-muted" />
            </button>

            {/* Modifier nom restaurant */}
            {restaurant && (
              <button
                type="button"
                onClick={() => setEditingField('name')}
                className="w-full flex items-center justify-between py-3.5 px-4 border-b border-border text-left"
              >
                <div>
                  <span className="text-[14px] font-medium text-text block">Nom du restaurant</span>
                  <span className="text-[12px] text-text-muted">{restaurant.name}</span>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            )}

            {/* Installer l'app */}
            {(isInstallable || isIOS) && !isInstalled && (
              <button
                type="button"
                onClick={isIOS ? undefined : install}
                className="w-full flex items-center justify-between py-3.5 px-4 text-left"
              >
                <div className="flex items-center gap-2.5">
                  <Download size={15} className="text-text-muted" />
                  <div>
                    <span className="text-[14px] font-medium text-text block">Installer l'app</span>
                    <span className="text-[12px] text-text-muted">
                      {isIOS
                        ? "Partager > Sur l'écran d'accueil"
                        : "Ajouter à l'écran d'accueil"}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
            )}

            {isInstalled && (
              <div className="flex items-center gap-2.5 py-3.5 px-4">
                <CheckCircle size={15} className="text-success" />
                <span className="text-[14px] text-text-secondary">Application installée</span>
              </div>
            )}
          </div>
        </div>

        {/* ===== ZONE 4: Déconnexion ===== */}
        <div className="mt-8">
          <button
            onClick={handleLogout}
            disabled={logoutForm.processing}
            className="text-[14px] text-text-muted text-center w-full"
          >
            <span className="flex items-center justify-center gap-1.5">
              <LogOut size={14} />
              Déconnexion
            </span>
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
