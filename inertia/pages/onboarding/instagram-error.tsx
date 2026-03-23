import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { RefreshCw } from 'lucide-react'

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
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Connexion Instagram
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            La connexion a rencontre un probleme.
          </p>

          {/* Error message */}
          <Card variant="flat" className="mt-6 bg-red-50">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4.5 h-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-red-800">Erreur de connexion</h3>
                <p className="text-[13px] text-red-600 mt-1 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          </Card>

          {/* Tips */}
          <Card variant="flat" className="mt-4">
            <h3 className="text-[14px] font-semibold text-text mb-3">Conseils pour reussir la connexion</h3>
            <ol className="text-[13px] text-text-secondary space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">1.</span>
                <span>Assurez-vous d'avoir un compte Instagram <strong className="text-text font-medium">professionnel</strong> ou <strong className="text-text font-medium">createur</strong></span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">2.</span>
                <span>Votre compte doit etre lie a une page Facebook</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">3.</span>
                <span>Acceptez toutes les autorisations demandees par Instagram</span>
              </li>
            </ol>
          </Card>

          <p className="text-[12px] text-text-muted text-center mt-4">
            Vous pouvez aussi connecter Instagram plus tard depuis vos parametres.
          </p>
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto space-y-2.5">
            <Button
              variant="primary"
              fullWidth
              icon={RefreshCw}
              onClick={handleRetry}
            >
              Reessayer
            </Button>
            <Button
              variant="secondary"
              fullWidth
              loading={skipForm.processing}
              onClick={handleSkip}
            >
              Continuer sans Instagram
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
