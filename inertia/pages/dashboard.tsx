import { Head, Link, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card, Heading } from '~/components/ui'
import { NotificationBanner } from '~/components/NotificationBanner'
import { MissionCalendar } from '~/components/MissionCalendar'
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
}

const MISSION_TYPE_LABELS: Record<string, string> = {
  post: 'Post',
  story: 'Story',
  reel: 'Réel',
  tuto: 'Tutoriel',
}

// Missions mockées temporaires pour le carousel (Story 9.6)
const MOCK_CAROUSEL_MISSIONS: CarouselMission[] = [
  {
    id: 'mock-1',
    title: 'Plat du jour',
    description: 'Photographiez votre spécialité du jour avec une belle lumière naturelle',
    coverImageUrl: 'https://picsum.photos/seed/plat/400/500',
    type: 'post',
  },
  {
    id: 'mock-2',
    title: 'Coulisses',
    description: 'Montrez les coulisses de votre cuisine en action',
    coverImageUrl: 'https://picsum.photos/seed/cuisine/400/500',
    type: 'story',
  },
  {
    id: 'mock-3',
    title: 'Équipe',
    description: 'Présentez un membre de votre équipe en vidéo courte',
    coverImageUrl: 'https://picsum.photos/seed/equipe/400/500',
    type: 'reel',
  },
]

export default function Dashboard({ user, restaurant, mission, streak, notifications, calendarMissions, plannedFutureDays }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleLogout() {
    router.post('/logout')
  }

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

        {/* Daily Objective & Mission Carousel (Story 9.6) */}
        <div className="mb-6">
          <DailyObjective
            objectiveType={MOCK_CAROUSEL_MISSIONS[0]?.type || 'post'}
            count={1}
          />
          {MOCK_CAROUSEL_MISSIONS.length > 0 ? (
            <MissionCarousel
              missions={MOCK_CAROUSEL_MISSIONS}
              onMissionStart={(missionId) => {
                // TODO: Story 9.8 - Navigation vers le flow de mission avec missionId
                router.visit(`/missions/${missionId}/start`)
              }}
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

        {/* Calendar */}
        <div className="mb-6">
          <Heading level={3} className="mb-3">Ton calendrier</Heading>
          <MissionCalendar missions={calendarMissions} plannedFutureDays={plannedFutureDays} />
        </div>

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
