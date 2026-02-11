import { Head, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images } from 'lucide-react'

interface DayStats {
  completed: number
  skipped: number
  pending: number
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

interface Props {
  year: number
  month: number
  missionsByDay: Record<string, DayStats>
  today: string
  selectedDate: string
  selectedDayMissions: DayMission[]
  level: LevelInfo
}

const WEEKDAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

const missionTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-4 h-4" />, label: 'Post' },
  story: { icon: <Smartphone className="w-4 h-4" />, label: 'Story' },
  reel: { icon: <Film className="w-4 h-4" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-4 h-4" />, label: 'Tuto' },
  engagement: { icon: <MessageCircle className="w-4 h-4" />, label: 'Engage' },
  carousel: { icon: <Images className="w-4 h-4" />, label: 'Carrousel' },
}

// ---- Date helpers ----

function toDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

function getMonday(d: Date): Date {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

function formatDayTitle(dateStr: string): string {
  const d = parseDate(dateStr)
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  let startDow = firstDay.getDay() - 1
  if (startDow < 0) startDow = 6

  const cells: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month - 1, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7))
  }
  return weeks
}

// ---- Component ----

export default function CalendarPage({ year, month, missionsByDay, today, selectedDate: initialSelectedDate, selectedDayMissions, level }: Props) {
  const [currentDate, setCurrentDate] = useState(initialSelectedDate)
  const [missions, setMissions] = useState<DayMission[]>(selectedDayMissions)
  const [loading, setLoading] = useState(false)
  const [showMonth, setShowMonth] = useState(false)
  const [monthViewYear, setMonthViewYear] = useState(year)
  const [monthViewMonth, setMonthViewMonth] = useState(month)

  const abortRef = useRef<AbortController | null>(null)
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  // Sync props when Inertia re-renders with new data
  useEffect(() => {
    setCurrentDate(initialSelectedDate)
    setMissions(selectedDayMissions)
    setMonthViewYear(year)
    setMonthViewMonth(month)
  }, [initialSelectedDate, selectedDayMissions, year, month])

  // Fetch missions for a given date via AJAX
  const fetchDay = useCallback(async (dateStr: string) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    setLoading(true)
    try {
      const res = await fetch(`/calendar/day/${dateStr}`, { signal })
      if (res.ok && !signal.aborted) {
        const data = await res.json()
        setMissions(data.missions || [])
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    } finally {
      if (!signal.aborted) setLoading(false)
    }
  }, [])

  const selectDate = useCallback((dateStr: string) => {
    setCurrentDate(dateStr)
    // If the date is in a different month, do a full Inertia visit to get new month stats
    const d = parseDate(dateStr)
    const newMonth = d.getMonth() + 1
    const newYear = d.getFullYear()
    if (newMonth !== monthViewMonth || newYear !== monthViewYear) {
      router.get('/calendar', { date: dateStr }, { preserveState: false })
      return
    }
    fetchDay(dateStr)
  }, [fetchDay, monthViewMonth, monthViewYear])

  const goToPrevDay = useCallback(() => {
    const prev = addDays(parseDate(currentDate), -1)
    selectDate(toDateStr(prev))
  }, [currentDate, selectDate])

  const goToNextDay = useCallback(() => {
    const next = addDays(parseDate(currentDate), 1)
    selectDate(toDateStr(next))
  }, [currentDate, selectDate])

  // ---- Swipe handling ----
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }, [])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - touchStartRef.current.x
    const dy = touch.clientY - touchStartRef.current.y
    const dt = Date.now() - touchStartRef.current.t
    touchStartRef.current = null

    if (dt > 300) return
    if (Math.abs(dx) < 50) return
    if (Math.abs(dy) > Math.abs(dx)) return

    if (dx < 0) {
      goToNextDay()
    } else {
      goToPrevDay()
    }
  }, [goToNextDay, goToPrevDay])

  // ---- Week view data ----
  const currentParsed = parseDate(currentDate)
  const monday = getMonday(currentParsed)
  const weekDays = getWeekDays(monday)

  // ---- Month view data ----
  const monthGrid = getMonthGrid(monthViewYear, monthViewMonth)
  const monthLabel = new Date(monthViewYear, monthViewMonth - 1, 1)
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const navigateMonth = (direction: -1 | 1) => {
    let newMonth = monthViewMonth + direction
    let newYear = monthViewYear
    if (newMonth < 1) { newMonth = 12; newYear-- }
    else if (newMonth > 12) { newMonth = 1; newYear++ }
    const firstOfMonth = `${newYear}-${String(newMonth).padStart(2, '0')}-01`
    router.get('/calendar', { date: firstOfMonth }, { preserveState: false })
  }

  // Day status dot color
  const getDotColor = (dateStr: string): string | null => {
    const stats = missionsByDay[dateStr]
    if (!stats) return null
    if (stats.completed > 0) return 'bg-green-500'
    if (stats.pending > 0) return 'bg-blue-400'
    if (stats.skipped > 0) return 'bg-neutral-400'
    return null
  }

  return (
    <AppLayout>
      <Head title="Calendrier - Le Phare" />

      {/* Compact level bar */}
      <div className="flex items-center justify-between py-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{level.levelIcon}</span>
          <span className="text-sm font-medium text-neutral-700">
            Niveau {level.currentLevel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-neutral-500">
            {level.isMaxLevel ? 'MAX' : `${level.xpProgressInLevel} / ${level.xpProgressInLevel + level.xpForNextLevel} XP`}
          </span>
        </div>
      </div>

      {/* Week selector (hidden when month view is open) */}
      {!showMonth && (
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((d, i) => {
            const dateStr = toDateStr(d)
            const isSelected = dateStr === currentDate
            const isToday = dateStr === today
            const dot = getDotColor(dateStr)

            return (
              <button
                key={i}
                onClick={() => selectDate(dateStr)}
                className={`
                  flex flex-col items-center py-2 rounded-xl transition-all
                  ${isSelected ? 'bg-primary text-white' : 'text-neutral-700'}
                  ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                `}
              >
                <span className={`text-[10px] font-medium mb-0.5 ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                  {WEEKDAY_LABELS[i]}
                </span>
                <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                  {d.getDate()}
                </span>
                {dot && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white' : dot}`} />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Month view toggle */}
      <button
        onClick={() => setShowMonth(!showMonth)}
        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {showMonth ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            Voir la semaine
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            Voir le mois
          </>
        )}
      </button>

      {/* Month view (expanded) */}
      {showMonth && (
        <div className="mb-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
            <span className="text-sm font-bold text-neutral-900 capitalize">{monthLabel}</span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-full hover:bg-neutral-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-neutral-400 py-1">
                {label}
              </div>
            ))}
          </div>

          {/* Month grid */}
          {monthGrid.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((d, di) => {
                if (!d) return <div key={di} className="aspect-square" />

                const dateStr = toDateStr(d)
                const isSelected = dateStr === currentDate
                const isToday = dateStr === today
                const dot = getDotColor(dateStr)

                return (
                  <button
                    key={di}
                    onClick={() => {
                      selectDate(dateStr)
                      setShowMonth(false)
                    }}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center transition-all
                      ${isSelected ? 'bg-primary text-white' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-primary' : ''}
                    `}
                  >
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-neutral-700'}`}>
                      {d.getDate()}
                    </span>
                    {dot && (
                      <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : dot}`} />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Selected day title */}
      <div className="py-3">
        <h2 className="text-base font-bold text-neutral-900 capitalize">
          {formatDayTitle(currentDate)}
        </h2>
      </div>

      {/* Missions list (swipeable) */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="min-h-[200px]"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-400 text-sm">Aucune mission ce jour</p>
          </div>
        ) : (
          <div className="space-y-2">
            {missions.map((mission) => {
              const config = missionTypeConfig[mission.template.type] || missionTypeConfig.post
              const isPending = mission.status === 'pending'
              const isCompleted = mission.status === 'completed'
              const isSkipped = mission.status === 'skipped'

              return (
                <div
                  key={mission.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-xl border transition-all
                    ${isCompleted ? 'bg-green-50/50 border-green-100' : ''}
                    ${isSkipped ? 'bg-neutral-50 border-neutral-100' : ''}
                    ${isPending ? 'bg-white border-neutral-100' : ''}
                  `}
                >
                  {/* Type icon */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-green-100 text-green-600' : ''}
                    ${isSkipped ? 'bg-neutral-100 text-neutral-400' : ''}
                    ${isPending ? 'bg-blue-50 text-blue-600' : ''}
                  `}>
                    {config.icon}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isSkipped ? 'text-neutral-400' : 'text-neutral-900'}`}>
                      {mission.template.title}
                    </p>
                    <p className="text-[11px] text-neutral-400">{config.label}</p>
                  </div>

                  {/* Status / action */}
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {isSkipped && (
                    <span className="text-xs text-neutral-400">Passé</span>
                  )}
                  {isPending && (
                    <button
                      onClick={() => router.visit(`/missions/${mission.id}`)}
                      className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg shrink-0"
                    >
                      Faire
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Swipe hint */}
      {missions.length > 0 && (
        <p className="text-center text-[10px] text-neutral-300 mt-4 mb-2">
          Glissez pour changer de jour
        </p>
      )}
    </AppLayout>
  )
}
