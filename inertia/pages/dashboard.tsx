import { Head, router, usePage } from '@inertiajs/react'
import { AppLayout } from '~/components/layout'
import { Card, Toast, PopoteMessage } from '~/components/ui'
import { StreakRestaurantBar, MissionCarousel, WeekProgress } from '~/components/features/home'
import { Calendar, BookOpen, BarChart3 } from 'lucide-react'
import { Link } from '@inertiajs/react'

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

function getPopoteGreeting(streak: Streak, missionsLeft: number): { message: string; variant: 'default' | 'happy' } {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon aprem' : 'Bonsoir'

  if (missionsLeft === 0) {
    return { message: `${greeting} ! Tu as tout bouclé aujourd'hui, bravo ! Repose-toi bien.`, variant: 'happy' }
  }
  if (streak.isAtRisk) {
    return { message: `${greeting} ! Attention, ta série de ${streak.current} jours est en danger ! Une petite mission pour la sauver ?`, variant: 'default' }
  }
  if (streak.current >= 7) {
    return { message: `${greeting} ! ${streak.current} jours d'affilée, t'es en feu ! On continue ?`, variant: 'happy' }
  }
  if (missionsLeft === 1) {
    return { message: `${greeting} ! Plus qu'une mission aujourd'hui, tu gères !`, variant: 'happy' }
  }
  return { message: `${greeting} ! ${missionsLeft} mission${missionsLeft > 1 ? 's' : ''} t'attend${missionsLeft > 1 ? 'ent' : ''} aujourd'hui. Allez, 5 min et c'est réglé !`, variant: 'default' }
}

function getWeekDays(calendarMissions: CalendarMission[]): { days: boolean[]; todayIndex: number } {
  const now = new Date()
  const dayOfWeek = now.getDay()
  // Convert to Mon=0 ... Sun=6
  const todayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  // Get Monday of current week
  const monday = new Date(now)
  monday.setDate(now.getDate() - todayIndex)

  const days: boolean[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const hasMissionCompleted = calendarMissions.some(
      (m) => m.date === dateStr && m.status === 'completed'
    )
    days.push(hasMissionCompleted)
  }

  return { days, todayIndex }
}

export default function Dashboard({ restaurant, todayMissions, streak, calendarMissions }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props

  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  const pendingMissions = todayMissions.filter((m) => m.status === 'pending')
  const popote = getPopoteGreeting(streak, pendingMissions.length)
  const { days, todayIndex } = getWeekDays(calendarMissions)

  return (
    <AppLayout>
      <Head title="Accueil" />

      {flash?.success && <Toast message={flash.success} type="success" />}

      <div className="space-y-5">
        {/* Header: Restaurant + Streak */}
        <div className="animate-fade-up">
          <StreakRestaurantBar
            restaurantName={restaurant.name}
            currentStreak={streak.current}
            longestStreak={streak.longest}
            isAtRisk={streak.isAtRisk}
          />
        </div>

        {/* Popote greeting */}
        <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
          <PopoteMessage
            message={popote.message}
            variant={popote.variant}
            size="md"
            typeSpeed={30}
          />
        </div>

        {/* Mission du jour - Hero */}
        <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
          {todayMissions.length > 0 ? (
            <MissionCarousel
              missions={todayMissions}
              onMissionStart={handleMissionStart}
            />
          ) : (
            <Card variant="elevated" className="text-center py-8">
              <span className="text-4xl mb-3 block">🌙</span>
              <p className="font-semibold text-text mb-1">Pas de mission aujourd'hui</p>
              <p className="text-sm text-text-muted">
                Repose-toi, tu l'as bien mérité !
              </p>
            </Card>
          )}
        </div>

        {/* Semaine en cours */}
        <div className="animate-fade-up" style={{ animationDelay: '150ms' }}>
          <WeekProgress days={days} todayIndex={todayIndex} />
        </div>

        {/* Raccourcis */}
        <div className="animate-fade-up grid grid-cols-3 gap-3" style={{ animationDelay: '200ms' }}>
          <Link href="/calendar" className="bg-surface rounded-[var(--radius-lg)] p-3.5 shadow-xs text-center hover:shadow-sm transition-shadow active:scale-[0.97]">
            <Calendar size={20} className="mx-auto mb-1.5 text-primary" />
            <p className="text-xs font-medium text-text-secondary">Calendrier</p>
          </Link>
          <Link href="/tutorials" className="bg-surface rounded-[var(--radius-lg)] p-3.5 shadow-xs text-center hover:shadow-sm transition-shadow active:scale-[0.97]">
            <BookOpen size={20} className="mx-auto mb-1.5 text-primary" />
            <p className="text-xs font-medium text-text-secondary">Tutos</p>
          </Link>
          <Link href="/statistics" className="bg-surface rounded-[var(--radius-lg)] p-3.5 shadow-xs text-center hover:shadow-sm transition-shadow active:scale-[0.97]">
            <BarChart3 size={20} className="mx-auto mb-1.5 text-primary" />
            <p className="text-xs font-medium text-text-secondary">Stats</p>
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
