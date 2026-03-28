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
import { ChevronRight, Check, Moon, Flame, Zap, ArrowRight } from 'lucide-react'
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
  if (streak.isAtRisk && h >= 18) return `Ta serie de ${streak.current} jours est en danger ! Vite, une mission avant minuit.`
  if (streak.current >= 14) return `${streak.current} jours d'affilee, tu geres ! Allez, on continue.`
  if (h >= 11 && h < 14) return 'Le service du midi, c\'est le moment ideal pour shooter ton plat du jour !'
  if (h >= 17 && h < 21) return 'Service du soir, l\'ambiance est parfaite pour une story !'
  if (pendingCount === 1) return 'Plus qu\'une mission. 5 minutes et c\'est boucle !'
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

      <div className="space-y-6">
        {/* ── Header: Greeting + Streak ── */}
        <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <TimeGreeting className="mb-1" />
              <h1 className="text-[24px] font-extrabold text-text leading-tight truncate max-w-[260px]">
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
        </div>

        {/* ── Week Tracker ── */}
        <div className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <WeekTracker days={days} todayIndex={todayIndex} />
        </div>

        {/* ── Popote Coach ── */}
        {popoteMessage && (
          <div className="animate-fade-up" style={{ animationDelay: '120ms' }}>
            <PopoteCoach
              message={popoteMessage}
              variant={streak.isAtRisk ? 'warning' : pendingMissions.length === 0 ? 'positive' : 'default'}
            />
          </div>
        )}

        {/* ── Hero Mission — Full-width immersive card ── */}
        {heroMission ? (
          <div className="animate-fade-up" style={{ animationDelay: '180ms' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
              <p className="text-[12px] font-bold text-text-secondary uppercase tracking-widest">
                {heroMission.isRecommended ? 'Objectif du jour' : 'Mission disponible'}
              </p>
            </div>
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
          <div
            className="relative bg-bg-card border border-border rounded-2xl py-14 px-6 text-center overflow-hidden animate-fade-up"
            style={{ animationDelay: '180ms' }}
          >
            {/* Subtle gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-bg-elevated to-bg-card opacity-60" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-bg-elevated border border-border flex items-center justify-center mx-auto mb-4">
                <Moon size={28} className="text-text-muted" />
              </div>
              <p className="text-[18px] font-bold text-text">Journee libre</p>
              <p className="text-[14px] text-text-muted mt-1.5 leading-relaxed">Profite de cette pause.</p>
            </div>
          </div>
        ) : null}

        {/* ── Other Missions — Compact cards ── */}
        {otherMissions.length > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '240ms' }}>
            <p className="text-[12px] font-bold text-text-secondary uppercase tracking-widest mb-3">
              Autres missions
            </p>
            <div className="space-y-2.5">
              {otherMissions.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => router.visit(`/missions/${m.id}`)}
                  className={`
                    w-full flex items-center gap-3.5 p-4 bg-bg-card border border-border rounded-2xl
                    active:scale-[0.97] transition-all duration-[var(--duration-fast)] text-left
                    hover:border-primary/20 hover:shadow-card-hover
                    ${m.status === 'completed' ? 'opacity-50' : ''}
                  `}
                  style={{ animationDelay: `${260 + i * 40}ms` }}
                >
                  <MissionTypeIcon type={m.type as MissionType} size={18} withBackground />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-text truncate">{m.title}</p>
                    <p className="text-[12px] text-text-muted capitalize mt-0.5">{m.type}</p>
                  </div>
                  {m.status === 'completed' ? (
                    <div className="w-7 h-7 rounded-full bg-success/15 flex items-center justify-center">
                      <Check size={14} className="text-success" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-bg-elevated flex items-center justify-center">
                      <ChevronRight size={14} className="text-text-muted" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Quick Stats Link ── */}
        {completedCount > 0 && (
          <div className="animate-fade-up" style={{ animationDelay: '300ms' }}>
            <InsightCard
              type="stat"
              message={`${completedCount} mission${completedCount > 1 ? 's' : ''} completee${completedCount > 1 ? 's' : ''} aujourd'hui. Vois l'impact sur tes stats.`}
              actionLabel="Voir mes stats"
              actionHref="/statistics"
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
