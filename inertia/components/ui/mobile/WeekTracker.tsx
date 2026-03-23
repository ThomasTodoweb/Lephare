import { Check } from 'lucide-react'

export interface WeekTrackerProps {
  /** Array of 7 booleans: true = mission done that day */
  days: boolean[]
  /** Index of today (0 = Monday, 6 = Sunday) */
  todayIndex: number
  className?: string
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function WeekTracker({ days, todayIndex, className = '' }: WeekTrackerProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {DAY_LABELS.map((label, i) => {
        const isDone = days[i]
        const isToday = i === todayIndex
        const isFuture = i > todayIndex
        const isPastUndone = i < todayIndex && !isDone

        return (
          <div key={i} className="flex flex-col items-center gap-1.5">
            {/* Day label */}
            <span
              className={`
                text-[10px] font-semibold uppercase tracking-wide
                ${isToday ? 'text-text' : 'text-text-muted'}
              `}
            >
              {label}
            </span>

            {/* Circle */}
            <div
              className={`
                w-9 h-9 rounded-full flex items-center justify-center
                transition-all duration-200
                ${isDone
                  ? 'bg-text'
                  : isToday
                    ? 'bg-transparent border-[2.5px] border-text'
                    : isFuture
                      ? 'bg-bg-subtle'
                      : isPastUndone
                        ? 'bg-bg-inset'
                        : 'bg-bg-subtle'
                }
              `}
            >
              {isDone ? (
                <Check size={14} strokeWidth={3} className="text-white" />
              ) : isToday ? (
                <div className="w-2 h-2 rounded-full bg-text" />
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/*
 * Usage:
 *
 * <WeekTracker
 *   days={[true, true, true, false, false, false, false]}
 *   todayIndex={3}
 * />
 */
