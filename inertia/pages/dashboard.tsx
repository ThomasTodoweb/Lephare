import { Head, Link, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Button, Card, Heading } from '~/components/ui'
import { NotificationBanner } from '~/components/NotificationBanner'
import { WelcomeMessage, StreakRestaurantBar, MissionCard } from '~/components/features/home'
import { LevelProgressBar } from '~/components/features/home/LevelProgressBar'
import { BookOpen } from 'lucide-react'

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
  level: LevelInfo
  flash?: {
    success?: string
  }
}

export default function Dashboard({ user, restaurant, mission, todayMissions, streak, notifications, calendarMissions, plannedFutureDays, level }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleLogout() {
    router.post('/logout')
  }

  // Navigate to mission when clicking
  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  // Find the recommended mission (mission du jour)
  const todayMission = todayMissions.find(m => m.isRecommended) || todayMissions[0]

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

        {/* Level Progress Bar */}
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

        {/* Mission du jour */}
        <div className="mb-6">
          <Heading level={2} className="mb-3 text-neutral-900">
            Ta mission du jour
          </Heading>
          {todayMission ? (
            <MissionCard
              mission={{
                id: todayMission.id,
                title: todayMission.title,
                description: todayMission.description,
                coverImageUrl: todayMission.coverImageUrl,
                type: todayMission.type,
                status: todayMission.status,
                isRecommended: todayMission.isRecommended,
              }}
              onStart={() => handleMissionStart(todayMission.id)}
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
              </div>
            </Card>
          )}
        </div>

        {/* Lien vers les tutoriels */}
        <div className="mb-6">
          <Link href="/tutorials" className="block">
            <Card className="flex items-center gap-4 hover:bg-neutral-50 transition-colors">
              <div className="bg-primary/10 rounded-full p-3">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <Heading level={4} className="text-neutral-900">
                  Tutoriels
                </Heading>
                <p className="text-sm text-neutral-600">
                  Apprends les meilleures pratiques Instagram
                </p>
              </div>
              <span className="text-primary font-medium text-sm">Voir →</span>
            </Card>
          </Link>
        </div>

      </div>
    </AppLayout>
  )
}
