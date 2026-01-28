import { Head, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { ChevronLeft, ChevronRight, Check, X as XIcon, Clock, Target, Star, Camera, Smartphone, Film, BookOpen, MessageCircle, Images } from 'lucide-react'
import { LevelProgressBar } from '~/components/features/home/LevelProgressBar'

interface DayStats {
  completed: number
  skipped: number
  pending: number
}

interface UpcomingMission {
  id: number
  date: string
  dateFormatted: string
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
  year: number
  month: number
  monthName: string
  missionsByDay: Record<string, DayStats>
  today: string
  upcomingMissions: UpcomingMission[]
  level: LevelInfo
}

interface DayMission {
  id: number
  status: 'pending' | 'completed' | 'skipped'
  assignedAt: string
  completedAt: string | null
  template: {
    type: string
    title: string
  }
}

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const missionTypeEmojis: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-4 h-4" />, label: 'Post' },
  story: { icon: <Smartphone className="w-4 h-4" />, label: 'Story' },
  reel: { icon: <Film className="w-4 h-4" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-4 h-4" />, label: 'Tuto' },
  engagement: { icon: <MessageCircle className="w-4 h-4" />, label: 'Engage' },
  carousel: { icon: <Images className="w-4 h-4" />, label: 'Carrousel' },
}

export default function CalendarPage({ year, month, monthName, missionsByDay, today, upcomingMissions, level }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayMissions, setDayMissions] = useState<DayMission[]>([])
  const [loadingDay, setLoadingDay] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Generate calendar grid
  const generateCalendarDays = useCallback(() => {
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const lastDayOfMonth = new Date(year, month, 0)
    const daysInMonth = lastDayOfMonth.getDate()

    // Monday = 0, Sunday = 6 (ISO week)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6

    const days: (number | null)[] = []

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }

    return days
  }, [year, month])

  const calendarDays = generateCalendarDays()

  const formatDateKey = (day: number) => {
    const m = String(month).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${year}-${m}-${d}`
  }

  const navigateMonth = (direction: -1 | 1) => {
    let newMonth = month + direction
    let newYear = year

    if (newMonth < 1) {
      newMonth = 12
      newYear -= 1
    } else if (newMonth > 12) {
      newMonth = 1
      newYear += 1
    }

    router.get('/calendar', { year: newYear, month: newMonth }, { preserveState: true })
  }

  const handleDayClick = async (day: number) => {
    // Abort any previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    const dateKey = formatDateKey(day)
    setSelectedDate(dateKey)
    setLoadingDay(true)

    try {
      const response = await fetch(`/calendar/day/${dateKey}`, { signal })
      if (response.ok && !signal.aborted) {
        const data = await response.json()
        setDayMissions(data.missions || [])
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was aborted, ignore silently
      }
      console.error('Failed to load day missions:', error)
    } finally {
      if (!signal.aborted) {
        setLoadingDay(false)
      }
    }
  }

  const closeDayPanel = () => {
    setSelectedDate(null)
    setDayMissions([])
  }

  const getDayStatus = (day: number) => {
    const dateKey = formatDateKey(day)
    const stats = missionsByDay[dateKey]
    const isToday = dateKey === today
    const isPast = dateKey < today
    const isFuture = dateKey > today

    return { stats, isToday, isPast, isFuture, dateKey }
  }

  const getMissionTypeEmoji = (type: string) => {
    const types: Record<string, string> = {
      post: '📸',
      story: '📱',
      reel: '🎬',
      carousel: '🖼️',
      tuto: '📚',
      engagement: '💬',
    }
    return types[type] || '📸'
  }

  return (
    <AppLayout>
      <Head title="Calendrier - Le Phare" />

      {/* Header */}
      <div className="pt-4 pb-4">
        <h1 className="text-2xl font-bolota font-bold text-neutral-900 uppercase">
          Calendrier
        </h1>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-neutral-600" />
        </button>
        <h2 className="text-lg font-bold text-neutral-900 capitalize">
          {monthName}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-full hover:bg-neutral-100 transition-colors"
        >
          <ChevronRight className="w-6 h-6 text-neutral-600" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-neutral-500 py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-6">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const { stats, isToday, isPast, isFuture, dateKey } = getDayStatus(day)
          const hasCompleted = stats?.completed > 0
          const hasSkipped = stats?.skipped > 0 && !hasCompleted
          const hasPending = stats?.pending > 0

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              className={`
                aspect-square rounded-xl flex flex-col items-center justify-center
                transition-all relative
                ${isToday ? 'ring-2 ring-primary bg-primary/10' : ''}
                ${isPast && !stats ? 'bg-neutral-50 text-neutral-300' : ''}
                ${isFuture && hasPending ? 'bg-blue-50' : ''}
                ${selectedDate === dateKey ? 'bg-primary/20' : ''}
                ${!isToday && stats ? 'hover:bg-neutral-100' : 'hover:bg-neutral-50'}
              `}
            >
              <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                {day}
              </span>

              {/* Status indicator */}
              {stats && (
                <div className="flex items-center gap-0.5 mt-1">
                  {hasCompleted && (
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {hasSkipped && (
                    <div className="w-2 h-2 rounded-full bg-neutral-400" />
                  )}
                  {isFuture && hasPending && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-neutral-600 mb-6 px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Complété</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-neutral-400" />
          <span>Passé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Planifié</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full border-2 border-primary" />
          <span>Aujourd'hui</span>
        </div>
      </div>

      {/* Level Progress */}
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

      {/* Upcoming missions */}
      {upcomingMissions.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold text-neutral-900 mb-3">Prochaines missions</h2>
          <div className="space-y-2">
            {upcomingMissions.map((mission) => {
              const typeConfig = missionTypeEmojis[mission.type] || missionTypeEmojis.post
              return (
                <button
                  key={mission.id}
                  type="button"
                  onClick={() => router.visit(`/missions/${mission.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl p-3 border border-neutral-100 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    {typeConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 text-sm truncate">{mission.title}</p>
                    <p className="text-xs text-neutral-500 capitalize">{mission.dateFormatted}</p>
                  </div>
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {typeConfig.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Day detail panel */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDayPanel}
          />

          {/* Panel */}
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900">
                {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <button
                onClick={closeDayPanel}
                className="p-2 rounded-full hover:bg-neutral-100"
              >
                <XIcon className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {loadingDay ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : dayMissions.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 mx-auto text-neutral-300 mb-3" />
                  <p className="text-neutral-500">Aucune mission ce jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayMissions.map((mission) => (
                    <div
                      key={mission.id}
                      className={`
                        p-4 rounded-xl border
                        ${mission.status === 'completed' ? 'bg-green-50 border-green-200' : ''}
                        ${mission.status === 'skipped' ? 'bg-neutral-50 border-neutral-200' : ''}
                        ${mission.status === 'pending' ? 'bg-white border-neutral-200' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getMissionTypeEmoji(mission.template.type)}</span>
                        <div className="flex-1">
                          <p className="font-medium text-neutral-900">
                            {mission.template.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {mission.status === 'completed' && (
                              <span className="flex items-center gap-1 text-xs text-green-600">
                                <Check className="w-3 h-3" />
                                Complété
                              </span>
                            )}
                            {mission.status === 'skipped' && (
                              <span className="text-xs text-neutral-500">Passé</span>
                            )}
                            {mission.status === 'pending' && (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <Clock className="w-3 h-3" />
                                À faire
                              </span>
                            )}
                          </div>
                        </div>
                        {mission.status === 'pending' && (
                          <button
                            onClick={() => router.visit(`/missions/${mission.id}`)}
                            className="px-3 py-1.5 bg-primary text-white text-sm font-medium rounded-lg"
                          >
                            Faire
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
