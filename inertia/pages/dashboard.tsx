import { Head, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card, Toast } from '~/components/ui'
import { StreakRestaurantBar, MissionCarousel, WeekProgress } from '~/components/features/home'

interface TodayMission {
  id: number
  title: string
  description: string
  coverImageUrl: string
  mediaType?: 'image' | 'video'
  carouselImages?: string[]
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
  user: { id: number; email: string; fullName?: string }
  restaurant: { name: string; type: string }
  mission: { id: number; status: string } | null
  todayMissions: TodayMission[]
  streak: Streak
  notifications: { hasSubscription: boolean; isConfigured: boolean }
  calendarMissions: CalendarMission[]
  plannedFutureDays: string[]
  flash?: { success?: string }
}

function getWeekDays(calendarMissions: CalendarMission[]): { days: boolean[]; todayIndex: number } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(now)
  monday.setDate(now.getDate() - todayIndex)

  const days: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push(calendarMissions.some((m) => m.date === dateStr && m.status === 'completed'))
  }
  return { days, todayIndex }
}

export default function Dashboard({ restaurant, todayMissions, streak, calendarMissions }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props
  const { days, todayIndex } = getWeekDays(calendarMissions)

  const pendingCount = todayMissions.filter((m) => m.status === 'pending').length
  const completedCount = todayMissions.filter((m) => m.status === 'completed').length

  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  return (
    <AppLayout>
      <Head title="Accueil" />
      {flash?.success && <Toast message={flash.success} type="success" />}

      <div className="space-y-5">
        {/* Header */}
        <StreakRestaurantBar
          restaurantName={restaurant.name}
          currentStreak={streak.current}
          longestStreak={streak.longest}
          isAtRisk={streak.isAtRisk}
        />

        {/* Week progress */}
        <WeekProgress days={days} todayIndex={todayIndex} />

        {/* Status line */}
        {todayMissions.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-secondary font-medium">
              {pendingCount > 0
                ? `${pendingCount} mission${pendingCount > 1 ? 's' : ''} aujourd'hui`
                : 'Toutes les missions sont faites !'}
            </p>
            {completedCount > 0 && (
              <p className="text-[13px] text-text-muted">
                {completedCount}/{todayMissions.length} faites
              </p>
            )}
          </div>
        )}

        {/* Missions */}
        {todayMissions.length > 0 ? (
          <MissionCarousel
            missions={todayMissions}
            onMissionStart={handleMissionStart}
          />
        ) : (
          <Card variant="flat" padding="lg" className="text-center">
            <p className="text-3xl mb-2">✨</p>
            <p className="font-semibold text-text text-[15px]">Journée libre</p>
            <p className="text-[13px] text-text-muted mt-1">
              Pas de mission aujourd'hui. Profitez-en !
            </p>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
