interface DailyObjectiveProps {
  objectiveType: string
  requiredCompleted: boolean
  bonusCount?: number
  bonusCompleted?: number
}

const OBJECTIVE_LABELS: Record<string, string> = {
  post: 'POST',
  story: 'STORY',
  reel: 'REEL',
  tuto: 'TUTO',
  engagement: 'ENGAGEMENT',
  carousel: 'CAROUSEL',
}

export function DailyObjective({ objectiveType, requiredCompleted, bonusCount = 0, bonusCompleted = 0 }: DailyObjectiveProps) {
  const label = OBJECTIVE_LABELS[objectiveType] || 'MISSION'

  return (
    <div className="text-center mb-4">
      <p className="italic text-text/70 text-base font-bold">
        {requiredCompleted ? 'Bravo ! Objectif atteint' : 'Objectif du jour :'}
      </p>
      <p className={`font-bolota text-2xl uppercase font-bold ${requiredCompleted ? 'text-green-600' : 'text-primary'}`}>
        1 {label}
      </p>
      {bonusCount > 0 && (
        <p className="text-sm text-neutral-500 mt-1">
          + {bonusCompleted}/{bonusCount} bonus
        </p>
      )}
    </div>
  )
}
