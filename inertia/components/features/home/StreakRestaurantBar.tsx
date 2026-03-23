import { StreakCounter } from './StreakCounter'

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
        <p className="text-sm text-text-muted">Bienvenue</p>
        <p className="font-bold text-text text-lg truncate max-w-[200px]">{restaurantName}</p>
      </div>
      <StreakCounter currentStreak={currentStreak} longestStreak={longestStreak} isAtRisk={isAtRisk} />
    </div>
  )
}
