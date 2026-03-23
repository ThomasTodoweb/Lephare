interface OnboardingProgressProps {
  currentStep: number
  totalSteps: number
  showBar?: boolean
}

export function OnboardingProgress({ currentStep, totalSteps, showBar = true }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="mb-6">
      <p className="text-[13px] font-medium text-text-muted mb-2">
        Etape {currentStep} sur {totalSteps}
      </p>
      {showBar && (
        <div className="h-1 bg-bg-subtle rounded-full overflow-hidden">
          <div
            className="h-full bg-text rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  )
}
