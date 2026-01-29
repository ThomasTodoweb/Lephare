interface StreakRestaurantBarProps {
  restaurantName: string
  currentStreak: number
  longestStreak: number
}

export function StreakRestaurantBar({
  restaurantName,
  currentStreak,
  longestStreak,
}: StreakRestaurantBarProps) {
  return (
    <div className="flex items-center justify-between">
      {/* Nom du restaurant en police BOLOTA */}
      <h1
        className="text-2xl text-neutral-900 truncate max-w-[200px]"
        style={{ fontFamily: 'Bolota, sans-serif' }}
      >
        {restaurantName}
      </h1>

      {/* Streak counter */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">🔥</span>
        <div className="text-right">
          <p className="font-bold text-primary text-lg leading-tight">{currentStreak} jours</p>
          <p className="text-xs text-neutral-500">Record : {longestStreak}</p>
        </div>
      </div>
    </div>
  )
}
