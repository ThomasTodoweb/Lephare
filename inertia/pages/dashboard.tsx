import { Head, router, usePage, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { Toast } from '~/components/ui'
import {
  TimeGreeting,
  StreakWidget,
  WeekTracker,
  PopoteCoach,
  MissionHeroCard,
  MissionTypeIcon,
  InsightCard,
} from '~/components/ui/mobile'
import { StreakMilestone } from '~/components/features/celebrations/StreakMilestone'
import { ChevronRight, Check } from 'lucide-react'
import type { MissionType } from '~/components/ui/mobile'

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

function getPopoteMessage(streak: Streak, pendingCount: number): string | null {
  const h = new Date().getHours()
  if (pendingCount === 0) return 'Bravo, toutes tes missions sont faites ! Repose-toi bien.'
  if (streak.isAtRisk && h >= 18) return `Ta série de ${streak.current} jours est en danger ! Vite, une mission avant minuit.`
  if (streak.current >= 14) return `${streak.current} jours d'affilée, tu gères ! Allez, on continue.`
  if (h >= 11 && h < 14) return 'Le service du midi, c\'est le moment idéal pour shooter ton plat du jour !'
  if (h >= 17 && h < 21) return 'Service du soir, l\'ambiance est parfaite pour une story !'
  if (pendingCount === 1) return 'Plus qu\'une mission. 5 minutes et c\'est bouclé !'
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

  const pendingMissions = todayMissions.filter((m) => m.status === 'pending')
  const completedCount = todayMissions.filter((m) => m.status === 'completed').length
  const heroMission = pendingMissions.find((m) => m.isRecommended) || pendingMissions[0]
  const otherMissions = todayMissions.filter((m) => m.id !== heroMission?.id)
  const popoteMessage = getPopoteMessage(streak, pendingMissions.length)

  // Streak milestone
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

  return (
    <AppLayout>
      <Head title="Accueil" />
      {flash?.success && <Toast message={flash.success} type="success" />}
      {showMilestone && <StreakMilestone days={streak.current} onDismiss={() => setShowMilestone(false)} />}

      <div className="space-y-5">
        {/* Header: Greeting + Name + Streak */}
        <div className="flex items-start justify-between animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div>
            <TimeGreeting className="mb-0.5" />
            <h1 className="text-[20px] font-bold text-text leading-tight truncate max-w-[240px]">
              {restaurant.name}
            </h1>
          </div>
          <StreakWidget
            currentStreak={streak.current}
            longestStreak={streak.longest}
            isAtRisk={streak.isAtRisk}
            completedToday={completedCount > 0}
          />
        </div>

        {/* Week tracker */}
        <div className="animate-fade-up" style={{ animationDelay: '50ms' }}>
          <WeekTracker days={days} todayIndex={todayIndex} />
        </div>

        {/* Popote Coach — contextual, dismissable */}
        {popoteMessage && (
          <PopoteCoach
            message={popoteMessage}
            variant={streak.isAtRisk ? 'warning' : pendingMissions.length === 0 ? 'positive' : 'default'}
          />
        )}

        {/* Hero Mission — THE one thing to do */}
        {heroMission ? (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              {heroMission.isRecommended ? 'Objectif du jour' : 'Mission disponible'}
            </p>
            <MissionHeroCard
              title={heroMission.title}
              description={heroMission.description}
              imageUrl={heroMission.coverImageUrl}
              type={heroMission.type as MissionType}
              completed={heroMission.status === 'completed'}
              onStart={() => router.visit(`/missions/${heroMission.id}`)}
            />
          </div>
        ) : pendingMissions.length === 0 && todayMissions.length === 0 ? (
          <div className="bg-bg-subtle rounded-2xl py-12 px-6 text-center">
            <p className="text-[28px] mb-2">🌙</p>
            <p className="text-[16px] font-semibold text-text">Journée libre</p>
            <p className="text-[13px] text-text-muted mt-1">Profite de cette pause.</p>
          </div>
        ) : null}

        {/* Other missions — compact list */}
        {otherMissions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
              Autres missions
            </p>
            <div className="space-y-2">
              {otherMissions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => router.visit(`/missions/${m.id}`)}
                  className={`
                    w-full flex items-center gap-3 p-3.5 bg-bg-card rounded-2xl shadow-card
                    active:scale-[0.98] transition-all text-left
                    ${m.status === 'completed' ? 'opacity-50' : ''}
                  `}
                >
                  <MissionTypeIcon type={m.type as MissionType} size={18} withBackground />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text truncate">{m.title}</p>
                    <p className="text-[11px] text-text-muted capitalize">{m.type}</p>
                  </div>
                  {m.status === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={12} className="text-green-600" />
                    </div>
                  ) : (
                    <ChevronRight size={16} className="text-text-muted" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick stats link */}
        {completedCount > 0 && (
          <InsightCard
            type="stat"
            message={`${completedCount} mission${completedCount > 1 ? 's' : ''} complétée${completedCount > 1 ? 's' : ''} aujourd'hui. Vois l'impact sur tes stats.`}
            actionLabel="Voir mes stats"
            actionHref="/statistics"
          />
        )}
      </div>
    </AppLayout>
  )
}
