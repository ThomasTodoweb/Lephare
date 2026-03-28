import { Check } from 'lucide-react'

interface WeekProgressProps {
  days: boolean[]
  todayIndex: number
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function WeekProgress({ days, todayIndex }: WeekProgressProps) {
  return (
    <div className="flex justify-between items-center gap-1">
      {DAY_LABELS.map((label, i) => {
        const isDone = days[i]
        const isToday = i === todayIndex
        const isFuture = i > todayIndex

        return (
          <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
            <span className={`text-[11px] font-medium ${isToday ? 'text-text font-semibold' : 'text-text-muted'}`}>
              {label}
            </span>
            <div
              className={`
                w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-semibold
                transition-all duration-200
                ${isDone
                  ? 'bg-text text-white'
                  : isToday
                    ? 'bg-bg-card border-2 border-text'
                    : isFuture
                      ? 'bg-bg-subtle text-text-muted'
                      : 'bg-bg-subtle border border-border text-text-muted'
                }
              `}
            >
              {isDone ? <Check size={14} strokeWidth={3} /> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
