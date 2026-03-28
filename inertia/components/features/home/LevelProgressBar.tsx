import { Award } from 'lucide-react'

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
  xpTotal,
  xpProgressInLevel,
  xpForNextLevel,
  progressPercent,
  isMaxLevel,
}: LevelProgressBarProps) {
  return (
    <div>
      {/* Level info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center">
            <Award size={16} className="text-primary" />
          </div>
          <span className="text-[15px] font-semibold text-text tracking-tight">
            Niveau {currentLevel}
          </span>
          <span className="text-[13px] text-text-secondary">{levelName}</span>
        </div>
        <span className="text-[13px] font-medium text-text-secondary">
          {xpTotal} XP
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-bg-subtle rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Progress text */}
      <div className="flex justify-between mt-1.5">
        {isMaxLevel ? (
          <span className="text-[12px] text-text-secondary leading-relaxed">Niveau maximum atteint</span>
        ) : (
          <>
            <span className="text-[12px] text-text-muted">
              {xpProgressInLevel} / {xpProgressInLevel + xpForNextLevel} XP
            </span>
            <span className="text-[12px] text-text-muted">
              Plus que {xpForNextLevel} XP
            </span>
          </>
        )}
      </div>
    </div>
  )
}
