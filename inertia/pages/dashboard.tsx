import { Head, Link, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card, Heading } from '~/components/ui'
import { NotificationBanner } from '~/components/NotificationBanner'
import { WelcomeMessage, StreakRestaurantBar, DailyObjective, MissionCarousel, type Mission as CarouselMission } from '~/components/features/home'

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

interface TodayMission {
  id: number
  title: string
  description: string
  coverImageUrl: string
  type: 'post' | 'story' | 'reel' | 'tuto' | 'engagement' | 'carousel'
  status: 'pending' | 'completed' | 'skipped'
  isRecommended: boolean
}

interface Streak {
  current: number
  longest: number
  isAtRisk: boolean
  message: string
}

interface CalendarMission {
  id: number
  date: string
  status: 'pending' | 'completed' | 'skipped'
  type: string
  title: string
}

interface Props {
  user: { id: number; email: string; fullName?: string; notificationBannerDismissed?: boolean }
  restaurant: { name: string; type: string }
  mission: Mission | null
  todayMissions: TodayMission[]
  streak: Streak
  notifications: {
    hasSubscription: boolean
    isConfigured: boolean
  }
  calendarMissions: CalendarMission[]
  plannedFutureDays: string[]
  flash?: {
    success?: string
  }
}

const MISSION_TYPE_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '📚',
  engagement: '💬',
}

const MISSION_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Réel',
  tuto: 'Tutoriel',
  engagement: 'Engagement',
}

export default function Dashboard({ user, restaurant, mission, todayMissions, streak, notifications, calendarMissions, plannedFutureDays }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleLogout() {
    router.post('/logout')
  }

  // Navigate to specific mission when clicking on carousel
  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  // Count completed missions
  const completedCount = todayMissions.filter(m => m.status === 'completed').length

  // Get the first mission type for DailyObjective
  const firstMissionType = todayMissions[0]?.type || 'post'

  return (
    <AppLayout >
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
        <div className="mb-6">
          <WelcomeMessage firstName={user.fullName?.split(' ')[0] || 'Chef'} />
        </div>

        {/* Streak & Restaurant Bar */}
        <div className="mb-6">
          <StreakRestaurantBar
            restaurantName={restaurant.name}
            restaurantType={restaurant.type}
            currentStreak={streak.current}
            longestStreak={streak.longest}
          />
          {streak.isAtRisk && (
            <p className="mt-2 text-sm text-orange-600 font-medium text-center">
              {streak.message}
            </p>
          )}
        </div>

        {/* Daily Objective & Mission Carousel */}
        <div className="mb-6">
          <DailyObjective
            objectiveType={firstMissionType}
            count={todayMissions.length}
            completedCount={completedCount}
          />
          {todayMissions.length > 0 ? (
            <MissionCarousel
              missions={todayMissions}
              onMissionStart={handleMissionStart}
            />
          ) : (
            <Card>
              <div className="text-center py-4">
                <span className="text-5xl mb-4 block">😴</span>
                <Heading level={3} className="mb-2">
                  Pas de mission aujourd'hui
                </Heading>
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
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Link href="/missions/history">
            <Card className="text-center py-2">
              <span className="text-lg mb-0.5 block">📋</span>
              <p className="text-xs font-medium text-neutral-700">Historique</p>
            </Card>
          </Link>
          <Link href="/tutorials">
            <Card className="text-center py-2">
              <span className="text-lg mb-0.5 block">📚</span>
              <p className="text-xs font-medium text-neutral-700">Tutoriels</p>
            </Card>
          </Link>
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
