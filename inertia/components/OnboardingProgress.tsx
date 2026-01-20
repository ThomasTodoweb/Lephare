interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  showBar?: boolean
}

export function OnboardingProgress({ currentStep, totalSteps, showBar = true }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-neutral-600">
          Etape {currentStep}/{totalSteps}
        </span>
        <span className="text-sm text-neutral-400">
          {Math.round(progress)}%
        </span>
      </div>
      {showBar && (
        <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
