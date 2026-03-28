import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { Check } from 'lucide-react'

interface Strategy {
  id: number
  name: string
  slug: string
  description: string
  icon: string
}

interface Props {
  strategies: Strategy[]
  currentStrategyId: number | null
  step: number
  totalSteps: number
}

export default function Strategy({ strategies, currentStrategyId, step, totalSteps }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    strategy_id: currentStrategyId || ('' as number | ''),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/onboarding/strategy')
  }

  const handleSelect = (strategyId: number) => {
    setData('strategy_id', strategyId)
  }

  return (
    <>
      <Head title="Choisis ta strategie - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Ton objectif ?
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            Choisis ce qui te correspond le mieux, on adapte ton parcours.
          </p>

          <div className="mt-6 space-y-3">
            {strategies.map((strategy) => {
              const isSelected = data.strategy_id === strategy.id
              return (
                <Card
                  key={strategy.id}
                  variant="interactive"
                  className={`transition-all border-2 ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                  onClick={() => handleSelect(strategy.id)}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="text-[28px] leading-none">{strategy.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-text">{strategy.name}</h3>
                      <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">{strategy.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {errors.strategy_id && (
            <p className="text-[12px] text-error font-medium mt-3">{errors.strategy_id}</p>
          )}
        </form>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border/50">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={processing}
              disabled={!data.strategy_id}
              onClick={handleSubmit}
            >
              Continuer
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
