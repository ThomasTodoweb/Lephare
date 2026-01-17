import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Rhythm {
  value: string
  label: string
  description: string
}

interface Props {
  rhythms: Rhythm[]
  currentRhythm: string | null
}

const RHYTHM_ICONS: Record<string, string> = {
  once_week: '📅',
  three_week: '📆',
  five_week: '🗓️',
  daily: '🔥',
}

export default function Rhythm({ rhythms, currentRhythm }: Props) {
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-neutral-600">Étape 3/4</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Votre rythme ?
          </h1>
          <p className="text-neutral-600 mt-2">
            À quelle fréquence souhaitez-vous publier sur Instagram ?
          </p>
        </div>

        {/* Rhythms */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 pb-32">
          <div className="space-y-3">
            {rhythms.map((rhythm) => (
              <Card
                key={rhythm.value}
                className={`cursor-pointer transition-all ${
                  data.publication_rhythm === rhythm.value
                    ? 'ring-4 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleSelect(rhythm.value)}
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{RHYTHM_ICONS[rhythm.value] || '📅'}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">{rhythm.label}</h3>
                    <p className="text-neutral-600 text-sm">{rhythm.description}</p>
                  </div>
                  {data.publication_rhythm === rhythm.value && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {errors.publication_rhythm && (
            <p className="text-red-500 text-sm mt-4">{errors.publication_rhythm}</p>
          )}
        </form>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!data.publication_rhythm || processing}
            className="w-full"
          >
            {processing ? 'Enregistrement...' : 'Continuer'}
          </Button>
        </div>
      </div>
    </>
  )
}
