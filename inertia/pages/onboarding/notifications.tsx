import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { usePushNotifications } from '~/hooks/use_push_notifications'
import { usePWAInstall } from '~/hooks/use_pwa_install'
import { Bell, Check } from 'lucide-react'

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
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Notifications
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            Recevez un rappel quotidien pour ne jamais oublier votre mission du jour.
          </p>

          <div className="mt-6">
            {isSubscribed ? (
              <Card className="border border-green-200 bg-green-50/50">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text">Notifications activees</p>
                    <p className="text-[13px] text-text-secondary">Rappel chaque jour a 10h</p>
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <Card variant="flat">
                  <h3 className="text-[14px] font-semibold text-text mb-2">Pourquoi activer les notifications ?</h3>
                  <ul className="text-[13px] text-text-secondary space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Rappel quotidien pour votre mission</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Alertes quand vos stats evoluent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Conseils personnalises au bon moment</span>
                    </li>
                  </ul>
                </Card>

                <div className="mt-4">
                  {!notificationsConfigured ? (
                    <Card variant="flat" className="bg-amber-50">
                      <p className="text-[13px] text-text-secondary leading-relaxed">
                        Les notifications ne sont pas encore configurees sur cette application. Vous pourrez les activer plus tard depuis votre profil.
                      </p>
                    </Card>
                  ) : !isSupported ? (
                    isInstalled ? (
                      <Card variant="flat" className="bg-blue-50">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4.5 h-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-text mb-1">Ouvrez Le Phare depuis votre ecran d'accueil</h4>
                            <p className="text-[13px] text-text-secondary leading-relaxed">
                              Pour activer les notifications, ouvrez l'application directement depuis l'icone Le Phare sur votre ecran d'accueil, puis revenez a cette etape.
                            </p>
                          </div>
                        </div>
                      </Card>
                    ) : (
                      <Card variant="flat" className="bg-amber-50">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4.5 h-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-[14px] font-semibold text-text mb-1">Installez d'abord l'application</h4>
                            <p className="text-[13px] text-text-secondary leading-relaxed">
                              Les notifications push ne fonctionnent que depuis l'application installee sur votre ecran d'accueil. Vous pourrez activer les notifications une fois l'app installee.
                            </p>
                          </div>
                        </div>
                      </Card>
                    )
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      icon={Bell}
                      loading={isLoading}
                      onClick={handleEnableNotifications}
                    >
                      Activer les notifications
                    </Button>
                  )}
                </div>

                {error && (
                  <p className="text-[12px] text-error font-medium text-center mt-3">{error}</p>
                )}

                <p className="text-[12px] text-text-muted text-center mt-4">
                  Vous pourrez modifier ces parametres a tout moment dans votre profil.
                </p>
              </>
            )}

            {/* Notification preview */}
            <div className="flex justify-center mt-10">
              <Card className="flex items-center gap-3 w-64">
                <div className="w-9 h-9 bg-text rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-[11px]">LP</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-text">Le Phare</p>
                  <p className="text-[12px] text-text-muted">C'est l'heure de ta mission !</p>
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={completeForm.processing}
              onClick={handleComplete}
            >
              Terminer
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
