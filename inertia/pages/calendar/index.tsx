import { Head, router } from '@inertiajs/react'
import { useState, useCallback, useRef, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
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
  post: { icon: <Camera className="w-4 h-4" />, label: 'Photo' },
  story: { icon: <Smartphone className="w-4 h-4" />, label: 'Story' },
  reel: { icon: <Film className="w-4 h-4" />, label: 'Vidéo' },
  tuto: { icon: <BookOpen className="w-4 h-4" />, label: 'Tuto' },
  engagement: { icon: <MessageCircle className="w-4 h-4" />, label: 'Engage' },
  carousel: { icon: <Images className="w-4 h-4" />, label: 'Album' },
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

export default function CalendarPage({ year, month, missionsByDay: initialMissionsByDay, today, selectedDate: initialSelectedDate, selectedDayMissions, level }: Props) {
  const [currentDate, setCurrentDate] = useState(initialSelectedDate)
  const [missions, setMissions] = useState<DayMission[]>(selectedDayMissions)
  const [loading, setLoading] = useState(false)
  const [showMonth, setShowMonth] = useState(false)
  const [monthViewYear, setMonthViewYear] = useState(year)
  const [monthViewMonth, setMonthViewMonth] = useState(month)
  const [dayStats, setDayStats] = useState<Record<string, DayStats>>(initialMissionsByDay)

  const abortDayRef = useRef<AbortController | null>(null)
  const abortMonthRef = useRef<AbortController | null>(null)
  const weekTouchRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const missionTouchRef = useRef<{ x: number; y: number; t: number } | null>(null)

  useEffect(() => {
    return () => {
      abortDayRef.current?.abort()
      abortMonthRef.current?.abort()
    }
  }, [])

  // Sync props when Inertia re-renders with new data
  useEffect(() => {
    setCurrentDate(initialSelectedDate)
    setMissions(selectedDayMissions)
    setMonthViewYear(year)
    setMonthViewMonth(month)
    setDayStats(initialMissionsByDay)
  }, [initialSelectedDate, selectedDayMissions, year, month, initialMissionsByDay])

  // Fetch missions for a given date via AJAX
  const fetchDay = useCallback(async (dateStr: string) => {
    abortDayRef.current?.abort()
    abortDayRef.current = new AbortController()
    const signal = abortDayRef.current.signal

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

  // Fetch month stats via AJAX (no full page reload)
  const fetchMonth = useCallback(async (newYear: number, newMonth: number) => {
    abortMonthRef.current?.abort()
    abortMonthRef.current = new AbortController()
    const signal = abortMonthRef.current.signal

    try {
      const res = await fetch(`/calendar/month/${newYear}/${newMonth}`, { signal })
      if (res.ok && !signal.aborted) {
        const data = await res.json()
        setDayStats(data.missionsByDay || {})
        setMonthViewYear(newYear)
        setMonthViewMonth(newMonth)
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
    }
  }, [])

  const selectDate = useCallback((dateStr: string) => {
    setCurrentDate(dateStr)
    const d = parseDate(dateStr)
    const newMonth = d.getMonth() + 1
    const newYear = d.getFullYear()
    if (newMonth !== monthViewMonth || newYear !== monthViewYear) {
      fetchMonth(newYear, newMonth)
    }
    fetchDay(dateStr)
  }, [fetchDay, fetchMonth, monthViewMonth, monthViewYear])

  const goToPrevWeek = useCallback(() => {
    const prev = addDays(parseDate(currentDate), -7)
    selectDate(toDateStr(prev))
  }, [currentDate, selectDate])

  const goToNextWeek = useCallback(() => {
    const next = addDays(parseDate(currentDate), 7)
    selectDate(toDateStr(next))
  }, [currentDate, selectDate])

  const goToPrevDay = useCallback(() => {
    const prev = addDays(parseDate(currentDate), -1)
    selectDate(toDateStr(prev))
  }, [currentDate, selectDate])

  const goToNextDay = useCallback(() => {
    const next = addDays(parseDate(currentDate), 1)
    selectDate(toDateStr(next))
  }, [currentDate, selectDate])

  // ---- Swipe on week selector (navigate weeks) ----
  const onWeekTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    weekTouchRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }, [])

  const onWeekTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!weekTouchRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - weekTouchRef.current.x
    const dy = touch.clientY - weekTouchRef.current.y
    const dt = Date.now() - weekTouchRef.current.t
    weekTouchRef.current = null

    if (dt > 400) return
    if (Math.abs(dx) < 40) return
    if (Math.abs(dy) > Math.abs(dx)) return

    if (dx < 0) {
      goToNextWeek()
    } else {
      goToPrevWeek()
    }
  }, [goToNextWeek, goToPrevWeek])

  // ---- Swipe on missions list (navigate days) ----
  const onMissionTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    missionTouchRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
  }, [])

  const onMissionTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!missionTouchRef.current) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - missionTouchRef.current.x
    const dy = touch.clientY - missionTouchRef.current.y
    const dt = Date.now() - missionTouchRef.current.t
    missionTouchRef.current = null

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
    fetchMonth(newYear, newMonth)
  }

  // Day status dot color
  const getDotColor = (dateStr: string): string | null => {
    const stats = dayStats[dateStr]
    if (!stats) return null
    if (stats.completed > 0) return 'bg-success'
    if (stats.pending > 0) return 'bg-warning'
    if (stats.skipped > 0) return 'bg-text-muted'
    return null
  }

  return (
    <AppLayout>
      <Head title="Calendrier - Le Phare" />

      {/* Compact level bar */}
      <div className="flex items-center justify-between py-3 px-1 animate-fade-up">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">{level.levelIcon}</span>
          <span className="text-[13px] font-medium text-text-secondary">
            Niveau {level.currentLevel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-bg-subtle rounded-full overflow-hidden">
            <div
              className="h-full bg-text rounded-full transition-all duration-500"
              style={{ width: `${level.progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-text-muted">
            {level.isMaxLevel ? 'MAX' : `${level.xpProgressInLevel} / ${level.xpProgressInLevel + level.xpForNextLevel} pts`}
          </span>
        </div>
      </div>

      {/* Week selector (hidden when month view is open) - swipe to change week */}
      {!showMonth && (
        <div
          className="grid grid-cols-7 gap-1 mb-2"
          onTouchStart={onWeekTouchStart}
          onTouchEnd={onWeekTouchEnd}
        >
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
                  flex flex-col items-center py-2.5 min-h-[44px] rounded-xl transition-all active:scale-[0.97]
                  ${isSelected ? 'bg-text text-white' : 'text-text'}
                  ${isToday && !isSelected ? 'ring-1 ring-text' : ''}
                `}
              >
                <span className={`text-[10px] font-medium mb-0.5 ${isSelected ? 'text-white/60' : 'text-text-muted'}`}>
                  {WEEKDAY_LABELS[i]}
                </span>
                <span className={`text-[13px] font-semibold ${isSelected ? 'text-white' : ''}`}>
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
        className="w-full flex items-center justify-center gap-1 py-2 text-[11px] text-text-muted hover:text-text-secondary transition-colors"
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
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-bg-subtle active:scale-[0.97] transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <span className="text-[14px] font-semibold text-text capitalize">{monthLabel}</span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-bg-subtle active:scale-[0.97] transition-all"
            >
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={i} className="text-center text-[10px] font-medium text-text-muted py-1">
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
                      aspect-square min-h-[44px] rounded-lg flex flex-col items-center justify-center transition-all active:scale-[0.97]
                      ${isSelected ? 'bg-text text-white' : ''}
                      ${isToday && !isSelected ? 'ring-1 ring-text' : ''}
                    `}
                  >
                    <span className={`text-[12px] font-medium ${isSelected ? 'text-white' : 'text-text'}`}>
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
        <h2 className="text-[15px] font-semibold text-text capitalize">
          {formatDayTitle(currentDate)}
        </h2>
      </div>

      {/* Missions list (swipeable - navigate days) */}
      <div
        onTouchStart={onMissionTouchStart}
        onTouchEnd={onMissionTouchEnd}
        className="min-h-[200px]"
      >
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-5 h-5 border-2 border-text border-t-transparent rounded-full animate-spin" />
          </div>
        ) : missions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[13px] text-text-muted">Aucune mission ce jour</p>
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
                    ${isCompleted ? 'bg-success/10 border-success/20' : ''}
                    ${isSkipped ? 'bg-bg-subtle border-border' : ''}
                    ${isPending ? 'bg-bg-card border-border' : ''}
                  `}
                >
                  {/* Type icon */}
                  <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                    ${isCompleted ? 'bg-success/10 text-success' : ''}
                    ${isSkipped ? 'bg-bg-subtle text-text-muted' : ''}
                    ${isPending ? 'bg-warning/10 text-warning' : ''}
                  `}>
                    {config.icon}
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-medium truncate ${isSkipped ? 'text-text-muted' : 'text-text'}`}>
                      {mission.template.title}
                    </p>
                    <p className="text-[11px] text-text-muted">{config.label}</p>
                  </div>

                  {/* Status / action */}
                  {isCompleted && (
                    <div className="flex items-center text-success">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                  {isSkipped && (
                    <span className="text-[11px] text-text-muted">Passé</span>
                  )}
                  {isPending && (
                    <Button
                      size="sm"
                      onClick={() => router.visit(`/missions/${mission.id}`)}
                    >
                      Go !
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Swipe hint */}
      {missions.length > 0 && (
        <p className="text-center text-[10px] text-text-muted mt-4 mb-2">
          Glissez pour changer de jour
        </p>
      )}
    </AppLayout>
  )
}
