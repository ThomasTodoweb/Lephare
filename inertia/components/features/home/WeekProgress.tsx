import { Check } from 'lucide-react'

interface WeekProgressProps {
  /** Array of 7 booleans for Mon-Sun, true = completed */
  days: boolean[]
  /** Index of today (0=Mon, 6=Sun) */
  todayIndex: number
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function WeekProgress({ days, todayIndex }: WeekProgressProps) {
  const completedCount = days.filter(Boolean).length

  return (
    <div className="bg-surface rounded-[var(--radius-lg)] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-text">Cette semaine</p>
        <p className="text-xs text-text-muted">{completedCount}/7 jours</p>
      </div>
      <div className="flex justify-between gap-1">
        {DAY_LABELS.map((label, i) => {
          const isDone = days[i]
          const isToday = i === todayIndex
          const isFuture = i > todayIndex

          return (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className={`text-[11px] font-medium ${isToday ? 'text-primary' : 'text-text-muted'}`}>
                {label}
              </span>
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-[var(--duration-normal)]
                  ${isDone
                    ? 'bg-primary text-white shadow-sm'
                    : isToday
                      ? 'border-2 border-primary bg-primary-50'
                      : isFuture
                        ? 'border-2 border-neutral-200 bg-neutral'
                        : 'border-2 border-neutral-300 bg-white'
                  }
                `}
              >
                {isDone ? (
                  <Check size={16} strokeWidth={3} />
                ) : isToday ? (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
