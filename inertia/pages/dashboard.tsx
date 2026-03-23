import { Head, router, usePage } from '@inertiajs/react'
import { useState, useEffect, useMemo } from 'react'
import { AppLayout } from '~/components/layout'
import { Card, Toast, PopoteMessage } from '~/components/ui'
import { MissionCarousel, WeekProgress } from '~/components/features/home'
import { StreakMilestone } from '~/components/features/celebrations/StreakMilestone'
import { Flame, ChevronRight } from 'lucide-react'
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

function getTimeGreeting(): string {
  const h = new Date().getHours()
  if (h >= 6 && h < 11) return 'Bon matin'
  if (h >= 11 && h < 14) return 'Bon service'
  if (h >= 14 && h < 17) return 'Bon après-midi'
  if (h >= 17 && h < 21) return 'Bon service du soir'
  return 'Bonne soirée'
}

function getPopoteCoach(streak: Streak, pendingCount: number, hour: number): { message: string; variant: 'default' | 'happy' } | null {
  if (pendingCount === 0) return { message: 'Tu as tout bouclé aujourd\'hui. Bravo, repose-toi !', variant: 'happy' }
  if (streak.isAtRisk && hour >= 18) return { message: `Attention ! Ta série de ${streak.current} jours est en danger. Vite, une mission avant minuit !`, variant: 'default' }
  if (streak.current >= 14) return { message: `${streak.current} jours d'affilée ! Tu es en feu, continue.`, variant: 'happy' }
  if (hour >= 11 && hour < 14) return { message: 'Le service du midi, c\'est le moment idéal pour shooter ton plat du jour !', variant: 'default' }
  if (pendingCount === 1) return { message: 'Plus qu\'une mission. 5 minutes et c\'est bouclé !', variant: 'happy' }
  return null
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

const STREAK_MILESTONES = [7, 14, 30, 60, 100]

export default function Dashboard({ restaurant, todayMissions, streak, calendarMissions }: Props) {
  const { flash } = usePage<{ flash?: { success?: string } }>().props
  const { days, todayIndex } = getWeekDays(calendarMissions)
  const hour = new Date().getHours()

  const pendingMissions = todayMissions.filter((m) => m.status === 'pending')
  const completedCount = todayMissions.filter((m) => m.status === 'completed').length
  const popoteCoach = getPopoteCoach(streak, pendingMissions.length, hour)

  // Check for streak milestone celebration
  const [showMilestone, setShowMilestone] = useState(false)
  useEffect(() => {
    if (STREAK_MILESTONES.includes(streak.current)) {
      const key = `milestone-${streak.current}`
      if (!localStorage.getItem(key)) {
        setShowMilestone(true)
        localStorage.setItem(key, 'true')
      }
    }
  }, [streak.current])

  function handleMissionStart(missionId: number) {
    router.visit(`/missions/${missionId}`)
  }

  return (
    <AppLayout>
      <Head title="Accueil" />
      {flash?.success && <Toast message={flash.success} type="success" />}

      {/* Streak Milestone Celebration */}
      {showMilestone && (
        <StreakMilestone days={streak.current} onDismiss={() => setShowMilestone(false)} />
      )}

      <div className="space-y-5">
        {/* Header: Greeting + Streak */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] text-text-muted">{getTimeGreeting()}</p>
            <h1 className="text-[20px] font-bold text-text leading-tight truncate max-w-[240px]">
              {restaurant.name}
            </h1>
          </div>
          {streak.current > 0 && (
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl ${streak.isAtRisk ? 'bg-red-50 border-2 border-red-200 animate-pulse-border' : 'bg-orange-50'}`}>
              <Flame size={18} className={`text-orange-500 ${streak.current >= 7 ? 'animate-wiggle' : ''}`} />
              <span className="text-[16px] font-black text-orange-600 tabular-nums">{streak.current}</span>
            </div>
          )}
        </div>

        {/* Popote Coach — contextual tip */}
        {popoteCoach && (
          <div className="bg-[#fdf8f3] border border-[#f0e6d9] rounded-2xl p-3.5">
            <div className="flex items-start gap-2.5">
              <img src="/images/popote.png" alt="Popote" className="w-8 h-8 rounded-xl object-contain bg-white border border-neutral-100 p-0.5 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Popote</p>
                <p className="text-[13px] text-text-secondary leading-relaxed mt-0.5">{popoteCoach.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Streak urgency alert */}
        {streak.isAtRisk && hour >= 18 && pendingMissions.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-3.5 animate-pulse-border">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="text-[13px] font-bold text-red-700">Streak en danger !</p>
                <p className="text-[11px] text-red-600">Complète une mission avant minuit</p>
              </div>
              <button
                onClick={() => handleMissionStart(pendingMissions[0].id)}
                className="bg-red-600 text-white text-[12px] font-bold px-3 py-1.5 rounded-xl active:scale-95"
              >
                Go
              </button>
            </div>
          </div>
        )}

        {/* Week tracker */}
        <WeekProgress days={days} todayIndex={todayIndex} />

        {/* Mission status */}
        {todayMissions.length > 0 && (
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-text">
              {pendingMissions.length > 0
                ? `${pendingMissions.length} mission${pendingMissions.length > 1 ? 's' : ''} à faire`
                : 'Tout est fait !'}
            </p>
            {completedCount > 0 && (
              <p className="text-[12px] text-text-muted">{completedCount}/{todayMissions.length}</p>
            )}
          </div>
        )}

        {/* Missions carousel */}
        {todayMissions.length > 0 ? (
          <MissionCarousel
            missions={todayMissions}
            onMissionStart={handleMissionStart}
          />
        ) : (
          <Card variant="flat" padding="lg" className="text-center py-10">
            <p className="text-[32px] mb-3">🌙</p>
            <p className="text-[16px] font-semibold text-text">Journée libre</p>
            <p className="text-[13px] text-text-muted mt-1 max-w-[240px] mx-auto">
              Pas de mission prévue. Profite de cette pause, tu l'as mérité.
            </p>
          </Card>
        )}

        {/* Quick access to stats */}
        {completedCount > 0 && (
          <Link href="/statistics" className="block">
            <Card variant="interactive" padding="md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📊</span>
                  <div>
                    <p className="text-[14px] font-semibold text-text">Tes statistiques</p>
                    <p className="text-[12px] text-text-muted">Vois l'impact de tes publications</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </div>
            </Card>
          </Link>
        )}
      </div>
    </AppLayout>
  )
}
