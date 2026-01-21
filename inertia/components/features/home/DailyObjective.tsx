interface DailyObjectiveProps {
  objectiveType: 'post' | 'story' | 'reel' | 'tuto'
  count?: number
}

const OBJECTIVE_LABELS: Record<string, string> = {
  post: 'POST',
  story: 'STORY',
  reel: 'REEL',
  tuto: 'TUTO',
}

export function DailyObjective({ objectiveType, count = 1 }: DailyObjectiveProps) {
  const label = OBJECTIVE_LABELS[objectiveType] || 'MISSION'

  return (
    <div className="text-center mb-4">
      <p className="italic text-text/70 text-sm">Objectif du jour :</p>
      <p className="font-bolota text-primary text-2xl uppercase font-bold">
        {count} {label}
      </p>
    </div>
  )
}
