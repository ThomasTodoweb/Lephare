import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'

interface Props {
  errorMessage: string
  step: number
  totalSteps: number
}

export default function InstagramError({ errorMessage, step = 4, totalSteps = 5 }: Props) {
  const skipForm = useForm({})

  const handleRetry = () => {
    window.location.href = '/instagram/connect'
  }

  const handleSkip = () => {
    skipForm.post('/onboarding/instagram/skip')
  }

  return (
    <>
      <Head title="Erreur Instagram - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Connexion Instagram
          </h1>
          <p className="text-neutral-600 mt-2">
            La connexion a rencontré un problème.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          <Card className="border-red-300 bg-red-50 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-red-800">Erreur de connexion</h3>
                <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="font-bold text-neutral-900 mb-3">Conseils pour réussir la connexion :</h3>
            <ul className="text-neutral-600 text-sm space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>Assurez-vous d'avoir un compte Instagram <strong>professionnel</strong> ou <strong>créateur</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Votre compte doit être lié à une page Facebook</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Acceptez toutes les autorisations demandées par Instagram</span>
              </li>
            </ul>
          </Card>

          <div className="text-center text-sm text-neutral-500">
            <p>Vous pouvez aussi connecter Instagram plus tard depuis vos paramètres.</p>
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Réessayer
          </Button>
          <Button
            variant="outlined"
            onClick={handleSkip}
            disabled={skipForm.processing}
            className="w-full"
          >
            {skipForm.processing ? 'Chargement...' : 'Continuer sans Instagram'}
          </Button>
        </div>
      </div>
    </>
  )
}
