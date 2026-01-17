import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

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
}

export default function Strategy({ strategies, currentStrategyId }: Props) {
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
      <Head title="Choisissez votre stratégie - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-neutral-600">Étape 2/4</span>
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Votre objectif ?
          </h1>
          <p className="text-neutral-600 mt-2">
            Choisissez ce qui vous correspond le mieux, on adapte votre parcours.
          </p>
        </div>

        {/* Strategies */}
        <form onSubmit={handleSubmit} className="flex-1 px-6 pb-32">
          <div className="space-y-4">
            {strategies.map((strategy) => (
              <Card
                key={strategy.id}
                className={`cursor-pointer transition-all ${
                  data.strategy_id === strategy.id
                    ? 'ring-4 ring-primary border-primary'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => handleSelect(strategy.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{strategy.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-neutral-900">{strategy.name}</h3>
                    <p className="text-neutral-600 text-sm mt-1">{strategy.description}</p>
                  </div>
                  {data.strategy_id === strategy.id && (
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

          {errors.strategy_id && (
            <p className="text-red-500 text-sm mt-4">{errors.strategy_id}</p>
          )}
        </form>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!data.strategy_id || processing}
            className="w-full"
          >
            {processing ? 'Enregistrement...' : 'Continuer'}
          </Button>
        </div>
      </div>
    </>
  )
}
