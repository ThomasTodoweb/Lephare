import { Head, Link, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card } from '~/components/ui'
import { NotificationBanner } from '~/components/NotificationBanner'

interface Mission {
  id: number
  status: string
  canUseAction: boolean
  usedPass: boolean
  usedReload: boolean
  template: {
    type: string
    title: string
    contentIdea: string
  }
}

interface Streak {
  current: number
  longest: number
  isAtRisk: boolean
  message: string
}

interface Props {
  user: { id: number; email: string; fullName?: string; notificationBannerDismissed?: boolean }
  restaurant: { name: string; type: string }
  mission: Mission | null
  streak: Streak
  notifications: {
    hasSubscription: boolean
    isConfigured: boolean
  }
  flash?: {
    success?: string
  }
}

const MISSION_TYPE_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '📚',
}

const MISSION_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Réel',
  tuto: 'Tutoriel',
}

export default function Dashboard({ user, restaurant, mission, streak, notifications }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleLogout() {
    router.post('/logout')
  }

  function handleAcceptMission() {
    if (mission) {
      router.post(`/missions/${mission.id}/accept`)
    }
  }

  function handleSkipMission() {
    if (mission) {
      router.post(`/missions/${mission.id}/skip`)
    }
  }

  function handleReloadMission() {
    if (mission) {
      router.post(`/missions/${mission.id}/reload`)
    }
  }

  return (
    <AppLayout currentPage="home">
      <Head title="Accueil" />

      {flash?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
          {flash.success}
        </div>
      )}

      {/* Notification banner - only shows for PWA users who haven't subscribed */}
      <NotificationBanner
        isConfigured={notifications.isConfigured}
        hasSubscription={notifications.hasSubscription}
        bannerDismissed={user.notificationBannerDismissed || false}
      />

      <div className="py-4">
        {/* Welcome header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold uppercase mb-1">
            Bienvenue {user.fullName || 'Chef'} !
          </h1>
          <p className="text-gray-600">{restaurant.name}</p>
        </div>

        {/* Streak card */}
        <Card className={`mb-6 ${streak.isAtRisk ? 'bg-orange-50 border-orange-300' : 'bg-white'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div>
                <p className="font-bold text-neutral-900">{streak.current} jours</p>
                <p className="text-xs text-neutral-500">Record : {streak.longest} jours</p>
              </div>
            </div>
          </div>
          <p className={`mt-3 text-sm ${streak.isAtRisk ? 'text-orange-600 font-medium' : 'text-neutral-600'}`}>
            {streak.message}
          </p>
        </Card>

        {/* Mission du jour */}
        {mission ? (
          <Card className="mb-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="text-3xl">{MISSION_TYPE_ICONS[mission.template.type] || '📋'}</span>
                <span className="text-xs font-bold text-primary uppercase">
                  {MISSION_TYPE_LABELS[mission.template.type] || 'Mission'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                {mission.template.title}
              </h2>

              <p className="text-neutral-600 text-sm mb-4">
                {mission.template.contentIdea}
              </p>

              <Link
                href="/missions"
                className="text-primary text-sm font-medium hover:underline mb-4 inline-block"
              >
                En savoir plus
              </Link>

              {mission.status === 'pending' ? (
                <>
                  <Button onClick={handleAcceptMission} className="w-full mb-3">
                    C'est parti !
                  </Button>

                  {mission.canUseAction && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleSkipMission}
                        className="flex-1 py-2 text-sm text-neutral-500 hover:text-neutral-700"
                      >
                        Passer
                      </button>
                      <button
                        type="button"
                        onClick={handleReloadMission}
                        className="flex-1 py-2 text-sm text-neutral-500 hover:text-neutral-700"
                      >
                        Autre mission
                      </button>
                    </div>
                  )}

                  {!mission.canUseAction && (
                    <p className="text-xs text-neutral-400 mt-2">
                      {mission.usedPass && '✓ Pass utilisé aujourd\'hui'}
                      {mission.usedReload && '✓ Reload utilisé aujourd\'hui'}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <span className="text-4xl mb-2 block">✓</span>
                  <p className="text-green-600 font-medium">Mission terminée !</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="mb-6">
            <div className="text-center py-4">
              <span className="text-5xl mb-4 block">😴</span>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">
                Pas de mission aujourd'hui
              </h2>
              <p className="text-neutral-600 text-sm">
                Repose-toi ou explore les tutoriels !
              </p>
              <Link href="/tutorials" className="block mt-4">
                <Button variant="outlined" className="w-full">
                  Voir les tutoriels
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link href="/missions/history">
            <Card className="text-center py-4">
              <span className="text-2xl mb-1 block">📋</span>
              <p className="text-sm font-medium text-neutral-700">Historique</p>
            </Card>
          </Link>
          <Link href="/tutorials">
            <Card className="text-center py-4">
              <span className="text-2xl mb-1 block">📚</span>
              <p className="text-sm font-medium text-neutral-700">Tutoriels</p>
            </Card>
          </Link>
        </div>

        {/* Restaurateur illustration */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">👨‍🍳</span>
          </div>
        </div>

        {/* Logout */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
