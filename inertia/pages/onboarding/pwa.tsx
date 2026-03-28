import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { usePWAInstall } from '~/hooks/use_pwa_install'
import { Check, Download } from 'lucide-react'

interface Props {
  step: number
  totalSteps: number
}

export default function Pwa({ step, totalSteps }: Props) {
  const continueForm = useForm({})
  const { isInstallable, isInstalled, isIOS, isIOSChrome, isIOSSafari, install } = usePWAInstall()

  const handleContinue = () => {
    continueForm.post('/onboarding/pwa/continue')
  }

  const handleInstall = async () => {
    await install()
  }

  // Share icon for Safari (upload arrow)
  const SafariShareIcon = () => (
    <svg className="w-4.5 h-4.5 inline-block align-middle text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )

  // Share icon for Chrome iOS (box with arrow)
  const ChromeShareIcon = () => (
    <svg className="w-4.5 h-4.5 inline-block align-middle text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )

  return (
    <>
      <Head title="Installer l'application - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Installe l'app
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            Ajoute Le Phare a ton ecran d'accueil pour y acceder en un clic.
          </p>

          <div className="mt-6">
            {isInstalled ? (
              <Card className="border border-green-500/30 bg-green-500/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold text-text">Application installee</p>
                    <p className="text-[13px] text-text-secondary">Accessible depuis ton ecran d'accueil</p>
                  </div>
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <Card variant="flat" className="bg-white/5 border border-border">
                  <h3 className="text-[14px] font-semibold text-text mb-2">Pourquoi installer l'app ?</h3>
                  <ul className="text-[13px] text-text-secondary space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">--</span>
                      <span>Acces rapide depuis ton ecran d'accueil</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">--</span>
                      <span>Experience optimisee pour mobile</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">--</span>
                      <span>Notifications push pour ne rien manquer</span>
                    </li>
                  </ul>
                </Card>

                <div className="mt-4">
                  {isIOSSafari ? (
                    <Card variant="flat" className="bg-blue-500/10 border border-blue-500/20">
                      <h3 className="text-[14px] font-semibold text-text mb-3">Comment installer sur Safari ?</h3>
                      <ol className="text-[13px] text-text-secondary space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">1.</span>
                          <span>Appuie sur le bouton de partage <SafariShareIcon /> en bas de l'ecran</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">2.</span>
                          <span>Fais defiler et appuie sur <strong className="text-text font-medium">"Sur l'ecran d'accueil"</strong></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">3.</span>
                          <span>Appuie sur <strong className="text-text font-medium">"Ajouter"</strong></span>
                        </li>
                      </ol>
                    </Card>
                  ) : isIOSChrome ? (
                    <Card variant="flat" className="bg-blue-500/10 border border-blue-500/20">
                      <h3 className="text-[14px] font-semibold text-text mb-3">Comment installer sur Chrome ?</h3>
                      <ol className="text-[13px] text-text-secondary space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">1.</span>
                          <span>Appuie sur le bouton partager <ChromeShareIcon /> en haut a droite (a cote de l'URL)</span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">2.</span>
                          <span>Appuie sur <strong className="text-text font-medium">"Ajouter a l'ecran d'accueil"</strong></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">3.</span>
                          <span>Confirme en appuyant sur <strong className="text-text font-medium">"Ajouter"</strong></span>
                        </li>
                      </ol>
                    </Card>
                  ) : isIOS ? (
                    <Card variant="flat" className="bg-blue-500/10 border border-blue-500/20">
                      <h3 className="text-[14px] font-semibold text-text mb-3">Comment installer sur iPhone ?</h3>
                      <ol className="text-[13px] text-text-secondary space-y-2.5">
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">1.</span>
                          <span>Appuie sur le bouton de partage <SafariShareIcon /></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">2.</span>
                          <span>Appuie sur <strong className="text-text font-medium">"Ajouter a l'ecran d'accueil"</strong></span>
                        </li>
                        <li className="flex items-start gap-2.5">
                          <span className="text-[13px] font-semibold text-text w-4 flex-shrink-0">3.</span>
                          <span>Appuie sur <strong className="text-text font-medium">"Ajouter"</strong></span>
                        </li>
                      </ol>
                    </Card>
                  ) : isInstallable ? (
                    <Button
                      variant="primary"
                      fullWidth
                      icon={Download}
                      onClick={handleInstall}
                    >
                      Installer l'application
                    </Button>
                  ) : (
                    <Card variant="flat" className="bg-white/5 border border-border">
                      <p className="text-[13px] text-text-secondary text-center">
                        Si tu vois deja l'icone Le Phare sur ton ecran d'accueil, c'est parfait !
                      </p>
                      <p className="text-[12px] text-text-muted text-center mt-1.5">
                        Sinon, utilise le menu de ton navigateur pour "Ajouter a l'ecran d'accueil".
                      </p>
                    </Card>
                  )}
                </div>
              </>
            )}

            {/* Visual preview */}
            <div className="flex justify-center mt-10">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl border border-border mx-auto flex items-center justify-center overflow-hidden relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-primary/10 blur-lg" />
                  <img src="/apple-touch-icon.png" alt="Le Phare" className="w-full h-full relative z-10" />
                </div>
                <span className="block text-[12px] font-medium text-text-secondary mt-2">LE PHARE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border/50">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={continueForm.processing}
              onClick={handleContinue}
            >
              Continuer
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
