import { useState, useMemo } from 'react'
import { Link } from '@inertiajs/react'

interface CalendarMission {
  id: number
  date: string // ISO date string (YYYY-MM-DD)
  status: 'pending' | 'completed' | 'skipped'
  type: string
  title: string
}

interface MissionCalendarProps {
  missions: CalendarMission[]
  currentMonth?: Date
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const MISSION_TYPE_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
  tuto: '📚',
}

export function MissionCalendar({ missions, currentMonth }: MissionCalendarProps) {
  const [viewDate, setViewDate] = useState(() => currentMonth || new Date())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  // Get the mission for a specific date
  const missionsByDate = useMemo(() => {
    const map = new Map<string, CalendarMission>()
    missions.forEach(m => {
      map.set(m.date, m)
    })
    return map
  }, [missions])

  // Calculate calendar grid
  const calendarData = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    // First day of month
    const firstDay = new Date(year, month, 1)
    // Last day of month
    const lastDay = new Date(year, month + 1, 0)

    // Get the day of week (0 = Sunday, we need Monday = 0)
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek < 0) startDayOfWeek = 6

    const daysInMonth = lastDay.getDate()

    // Generate days array
    const days: { date: Date | null; dayNumber: number | null }[] = []

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, dayNumber: null })
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        dayNumber: i
      })
    }

    return days
  }, [viewDate])

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const isToday = (date: Date): boolean => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isPast = (date: Date): boolean => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  const isFuture = (date: Date): boolean => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    return date > today
  }

  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))
    setSelectedDay(null)
  }

  const handleDayClick = (date: Date) => {
    const dateKey = formatDateKey(date)
    const mission = missionsByDate.get(dateKey)

    if (mission) {
      setSelectedDay(selectedDay === dateKey ? null : dateKey)
    }
  }

  const selectedMission = selectedDay ? missionsByDate.get(selectedDay) : null

  return (
    <div className="bg-white rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPreviousMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600"
        >
          ←
        </button>
        <h3 className="font-bold text-neutral-900">
          {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-600"
        >
          →
        </button>
      </div>

      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_SHORT.map(day => (
          <div key={day} className="text-center text-xs font-medium text-neutral-400 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((day, index) => {
          if (!day.date) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const dateKey = formatDateKey(day.date)
          const mission = missionsByDate.get(dateKey)
          const today = isToday(day.date)
          const past = isPast(day.date)
          const future = isFuture(day.date)
          const isSelected = selectedDay === dateKey

          // Determine cell state
          let cellClass = 'aspect-square flex flex-col items-center justify-center rounded-xl text-sm relative cursor-pointer transition-all '

          if (today) {
            cellClass += 'ring-2 ring-primary '
          }

          if (mission) {
            if (mission.status === 'completed') {
              cellClass += 'bg-green-100 text-green-700 '
            } else if (mission.status === 'skipped') {
              cellClass += 'bg-neutral-100 text-neutral-400 '
            } else if (past) {
              cellClass += 'bg-red-50 text-red-500 '
            } else {
              cellClass += 'bg-primary/10 text-primary '
            }
          } else if (future) {
            cellClass += 'text-neutral-300 '
          } else {
            cellClass += 'text-neutral-500 '
          }

          if (isSelected) {
            cellClass += 'ring-2 ring-primary ring-offset-1 '
          }

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => handleDayClick(day.date!)}
              className={cellClass}
              disabled={!mission}
            >
              <span className={`text-sm ${today ? 'font-bold' : ''}`}>
                {day.dayNumber}
              </span>
              {mission && (
                <span className="text-[10px] leading-none mt-0.5">
                  {mission.status === 'completed' ? '✓' : mission.status === 'skipped' ? '−' : MISSION_TYPE_ICONS[mission.type] || '•'}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-neutral-100">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-3 rounded bg-green-100 flex items-center justify-center text-green-700 text-[8px]">✓</span>
          <span>Faite</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-3 rounded bg-primary/10" />
          <span>À faire</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
          <span className="w-3 h-3 rounded bg-neutral-100" />
          <span>Passée</span>
        </div>
      </div>

      {/* Selected mission details */}
      {selectedMission && (
        <div className="mt-4 pt-4 border-t border-neutral-100">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
            <span className="text-2xl">
              {MISSION_TYPE_ICONS[selectedMission.type] || '📋'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-neutral-900 truncate text-sm">
                {selectedMission.title}
              </p>
              <p className="text-xs text-neutral-500">
                {new Date(selectedMission.date).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {selectedMission.status === 'completed' && (
                <span className="text-green-600 text-xl">✓</span>
              )}
              {selectedMission.status === 'skipped' && (
                <span className="text-neutral-400 text-sm">Passée</span>
              )}
              <Link
                href={`/missions/${selectedMission.id}`}
                className="text-primary text-sm font-medium hover:underline"
              >
                Voir
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
