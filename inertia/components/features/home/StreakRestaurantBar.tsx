import { RestaurantBadge } from './RestaurantBadge'
import { StreakCounter } from './StreakCounter'

interface StreakRestaurantBarProps {
  restaurantName: string
  restaurantType: string
  currentStreak: number
  longestStreak: number
}

export function StreakRestaurantBar({
  restaurantName,
  restaurantType,
  currentStreak,
  longestStreak,
}: StreakRestaurantBarProps) {
  return (
    <div className="flex items-center justify-between bg-neutral rounded-3xl p-4">
      <RestaurantBadge restaurantName={restaurantName} restaurantType={restaurantType} />
      <StreakCounter currentStreak={currentStreak} longestStreak={longestStreak} />
    </div>
  )
}
