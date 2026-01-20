import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { usePushNotifications } from '~/hooks/use_push_notifications'
import { usePWAInstall } from '~/hooks/use_pwa_install'

interface Props {
  step: number
  totalSteps: number
  notificationsConfigured: boolean
}

export default function Notifications({ step, totalSteps, notificationsConfigured }: Props) {
  const completeForm = useForm({})
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
  } = usePushNotifications('10:00')

  const { isInstalled } = usePWAInstall()

  const handleComplete = () => {
    completeForm.post('/onboarding/complete')
  }

  const handleEnableNotifications = async () => {
    await subscribe()
  }

  // Check if we're in standalone mode (PWA)
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  )

  return (
    <>
      <Head title="Notifications - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Notifications
          </h1>
          <p className="text-neutral-600 mt-2">
            Recevez un rappel quotidien pour ne jamais oublier votre mission du jour !
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {isSubscribed ? (
            <Card className="border-green-500 bg-green-50 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800">Notifications activees !</h3>
                  <p className="text-green-600 text-sm">Vous recevrez un rappel chaque jour a 10h</p>
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">Pourquoi activer les notifications ?</h3>
                    <ul className="text-neutral-600 text-sm mt-2 space-y-1">
                      <li>• Rappel quotidien pour votre mission</li>
                      <li>• Alertes quand vos stats evoluent</li>
                      <li>• Conseils personnalises au bon moment</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {!notificationsConfigured ? (
                <Card className="mb-6 bg-yellow-50 border-yellow-200">
                  <p className="text-yellow-700 text-sm">
                    Les notifications ne sont pas encore configurees sur cette application. Vous pourrez les activer plus tard depuis votre profil.
                  </p>
                </Card>
              ) : !isSupported ? (
                // Browser doesn't support push notifications
                isInstalled ? (
                  // PWA is installed but user is browsing in regular browser
                  <Card className="mb-6 bg-blue-50 border-blue-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-800 mb-1">Ouvrez Le Phare depuis votre ecran d'accueil</h4>
                        <p className="text-blue-700 text-sm">
                          Pour activer les notifications, ouvrez l'application directement depuis l'icone Le Phare sur votre ecran d'accueil, puis revenez a cette etape.
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  // PWA not installed yet
                  <Card className="mb-6 bg-yellow-50 border-yellow-200">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-bold text-yellow-800 mb-1">Installez d'abord l'application</h4>
                        <p className="text-yellow-700 text-sm">
                          Les notifications push ne fonctionnent que depuis l'application installee sur votre ecran d'accueil. Vous pourrez activer les notifications une fois l'app installee.
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              ) : (
                <Button
                  onClick={handleEnableNotifications}
                  disabled={isLoading}
                  className="w-full mb-4"
                >
                  {isLoading ? 'Activation...' : 'Activer les notifications'}
                </Button>
              )}

              {error && (
                <p className="text-red-500 text-sm text-center mb-4">{error}</p>
              )}

              <div className="text-center">
                <p className="text-neutral-500 text-sm">
                  Vous pourrez modifier ces parametres a tout moment dans votre profil.
                </p>
              </div>
            </>
          )}

          {/* Visual */}
          <div className="flex justify-center mt-8">
            <div className="bg-neutral-100 rounded-2xl p-4 shadow-inner">
              <div className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3 w-64">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-neutral-900">Le Phare</p>
                  <p className="text-xs text-neutral-600">C'est l'heure de ta mission !</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            onClick={handleComplete}
            disabled={completeForm.processing}
            className="w-full"
          >
            {completeForm.processing ? 'Finalisation...' : 'Terminer'}
          </Button>
        </div>
      </div>
    </>
  )
}
