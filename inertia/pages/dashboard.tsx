import { Head, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card, Heading } from '~/components/ui'
import { NotificationBanner } from '~/components/NotificationBanner'
import { StreakRestaurantBar, MissionCarousel } from '~/components/features/home'

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

export default function Dashboard({ user, restaurant, todayMissions, streak, notifications }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  // Navigate to mission when clicking
  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  return (
    <AppLayout>
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
        {/* Streak & Restaurant Bar - En haut */}
        <div className="mb-6">
          <StreakRestaurantBar
            restaurantName={restaurant.name}
            currentStreak={streak.current}
            longestStreak={streak.longest}
          />
        </div>

        {/* Titre Mission du jour - Centré et plus petit */}
        <p className="text-center text-neutral-500 text-sm mb-4">
          Mission du jour
        </p>

        {/* Missions du jour - Carousel swipable */}
        <div className="mb-6">
          {todayMissions.length > 0 ? (
            <MissionCarousel
              missions={todayMissions}
              onMissionStart={handleMissionStart}
            />
          ) : (
            <Card>
              <div className="text-center py-8">
                <span className="text-5xl mb-4 block">😴</span>
                <Heading level={3} className="mb-2">
                  Pas de mission aujourd'hui
                </Heading>
                <p className="text-neutral-600 text-sm">
                  Repose-toi, tu l'as bien mérité !
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
