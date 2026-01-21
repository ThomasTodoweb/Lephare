interface DailyObjectiveProps {
  objectiveType: string
  count?: number
  completedCount?: number
}

const OBJECTIVE_LABELS: Record<string, string> = {
  post: 'POST',
  story: 'STORY',
  reel: 'REEL',
  tuto: 'TUTO',
  engagement: 'SOCIAL',
  carousel: 'CAROUSEL',
}

export function DailyObjective({ objectiveType, count = 1, completedCount = 0 }: DailyObjectiveProps) {
  const label = count > 1 ? 'MISSIONS' : (OBJECTIVE_LABELS[objectiveType] || 'MISSION')
  const allCompleted = count > 0 && completedCount === count

  return (
    <div className="text-center mb-4">
      <p className="italic text-text/70 text-sm">
        {allCompleted ? 'Bravo ! Objectif atteint :' : 'Objectif du jour :'}
      </p>
      <p className={`font-bolota text-2xl uppercase font-bold ${allCompleted ? 'text-green-600' : 'text-primary'}`}>
        {completedCount > 0 ? `${completedCount}/${count}` : count} {label}
      </p>
    </div>
  )
}
