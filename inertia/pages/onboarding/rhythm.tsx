import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { Check } from 'lucide-react'

interface Rhythm {
  value: string
  label: string
  description: string
}

interface Props {
  rhythms: Rhythm[]
  currentRhythm: string | null
  step: number
  totalSteps: number
}

const RHYTHM_ICONS: Record<string, string> = {
  once_week: '1x',
  three_week: '3x',
  five_week: '5x',
  daily: '7x',
}

export default function Rhythm({ rhythms, currentRhythm, step, totalSteps }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    publication_rhythm: currentRhythm || ('' as string),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/onboarding/rhythm')
  }

  const handleSelect = (rhythm: string) => {
    setData('publication_rhythm', rhythm)
  }

  return (
    <>
      <Head title="Votre rythme de publication - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        <form onSubmit={handleSubmit} className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Votre rythme ?
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            A quelle frequence souhaitez-vous publier sur Instagram ?
          </p>

          <div className="mt-6 space-y-3">
            {rhythms.map((rhythm) => {
              const isSelected = data.publication_rhythm === rhythm.value
              return (
                <Card
                  key={rhythm.value}
                  variant="interactive"
                  className={`transition-all ${
                    isSelected ? 'border-2 border-text' : 'border-2 border-transparent'
                  }`}
                  onClick={() => handleSelect(rhythm.value)}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center flex-shrink-0">
                      <span className="text-[13px] font-bold text-text">{RHYTHM_ICONS[rhythm.value] || '?'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-text">{rhythm.label}</h3>
                      <p className="text-[13px] text-text-muted mt-0.5">{rhythm.description}</p>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 bg-text rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {errors.publication_rhythm && (
            <p className="text-[12px] text-error font-medium mt-3">{errors.publication_rhythm}</p>
          )}
        </form>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={processing}
              disabled={!data.publication_rhythm}
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
