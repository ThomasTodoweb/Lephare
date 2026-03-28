import { Flame } from 'lucide-react'

interface StreakRestaurantBarProps {
  restaurantName: string
  currentStreak: number
  longestStreak: number
  isAtRisk?: boolean
}

export function StreakRestaurantBar({
  restaurantName,
  currentStreak,
  longestStreak,
  isAtRisk,
}: StreakRestaurantBarProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[13px] text-text-muted font-medium">Bonjour</p>
        <p className="text-[18px] font-bold text-text leading-tight truncate max-w-[220px]">
          {restaurantName}
        </p>
      </div>
      {currentStreak > 0 && (
        <div className="flex items-center gap-1.5 bg-warning-light px-3 py-2 rounded-xl min-h-[44px]">
          <Flame size={18} className="text-streak" />
          <span className="text-[15px] font-bold text-streak">{currentStreak}</span>
        </div>
      )}
    </div>
  )
}
