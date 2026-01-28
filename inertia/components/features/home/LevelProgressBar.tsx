import { Star } from 'lucide-react'

interface LevelProgressBarProps {
  currentLevel: number
  levelName: string
  levelIcon: string
  xpTotal: number
  xpProgressInLevel: number
  xpForNextLevel: number
  progressPercent: number
  isMaxLevel: boolean
}

export function LevelProgressBar({
  currentLevel,
  levelName,
  levelIcon,
  xpTotal,
  xpProgressInLevel,
  xpForNextLevel,
  progressPercent,
  isMaxLevel,
}: LevelProgressBarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
      {/* Level header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelIcon}</span>
          <div>
            <p className="text-sm font-bold text-neutral-900">Niveau {currentLevel}</p>
            <p className="text-xs text-neutral-500">{levelName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-amber-700">{xpTotal} XP</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="h-3 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Progress text */}
        <div className="flex justify-between mt-1.5">
          {isMaxLevel ? (
            <span className="text-xs text-primary font-medium">Niveau maximum atteint !</span>
          ) : (
            <>
              <span className="text-xs text-neutral-500">
                {xpProgressInLevel} / {xpProgressInLevel + xpForNextLevel} XP
              </span>
              <span className="text-xs text-neutral-500">
                Plus que {xpForNextLevel} XP
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
