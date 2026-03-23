interface StreakCounterProps {
  currentStreak: number
  longestStreak: number
  isAtRisk?: boolean
}

export function StreakCounter({ currentStreak, longestStreak, isAtRisk = false }: StreakCounterProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] ${isAtRisk ? 'bg-warning-light animate-pulse-glow' : 'bg-orange-50'}`}>
      <span className="text-3xl" role="img" aria-label="streak">🔥</span>
      <div>
        <p className="font-bold text-streak text-xl leading-tight">{currentStreak}</p>
        <p className="text-xs text-text-muted">
          {currentStreak === 1 ? 'jour' : 'jours'}
          {longestStreak > currentStreak && (
            <span className="ml-1">· Record {longestStreak}</span>
          )}
        </p>
      </div>
    </div>
  )
}
