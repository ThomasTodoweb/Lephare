interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
}

export function StreakCounter({ currentStreak, longestStreak }: StreakCounterProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl">🔥</span>
      <div className="text-right">
        <p className="font-bold text-primary text-lg leading-tight">{currentStreak} jours</p>
        <p className="text-xs text-neutral-500">Record : {longestStreak} jours</p>
      </div>
    </div>
  )
}
