import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { usePWAInstall } from '~/hooks/use_pwa_install'

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
    <svg className="w-5 h-5 inline-block align-middle text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  )

  // Share icon for Chrome iOS (box with arrow)
  const ChromeShareIcon = () => (
    <svg className="w-5 h-5 inline-block align-middle text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  )

  return (
    <>
      <Head title="Installer l'application - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Installez l'app
          </h1>
          <p className="text-neutral-600 mt-2">
            Ajoutez Le Phare a votre ecran d'accueil pour y acceder en un clic !
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {isInstalled ? (
            <Card className="border-green-500 bg-green-50 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-green-800">Application installee !</h3>
                  <p className="text-green-600 text-sm">Vous pouvez maintenant y acceder depuis votre ecran d'accueil</p>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">Pourquoi installer l'app ?</h3>
                    <ul className="text-neutral-600 text-sm mt-2 space-y-1">
                      <li>• Acces rapide depuis votre ecran d'accueil</li>
                      <li>• Experience optimisee pour mobile</li>
                      <li>• Notifications push pour ne rien manquer</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {isIOSSafari ? (
                // Instructions for iOS Safari
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3">Comment installer sur Safari ?</h3>
                  <ol className="text-blue-700 text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Appuyez sur le bouton de partage <SafariShareIcon /> en bas de l'ecran</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Faites defiler et appuyez sur <strong>"Sur l'ecran d'accueil"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Appuyez sur <strong>"Ajouter"</strong></span>
                    </li>
                  </ol>
                </Card>
              ) : isIOSChrome ? (
                // Instructions for iOS Chrome
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3">Comment installer sur Chrome ?</h3>
                  <ol className="text-blue-700 text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Appuyez sur le bouton partager <ChromeShareIcon /> en haut a droite (a cote de l'URL)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Appuyez sur <strong>"Ajouter a l'ecran d'accueil"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Confirmez en appuyant sur <strong>"Ajouter"</strong></span>
                    </li>
                  </ol>
                </Card>
              ) : isIOS ? (
                // Generic iOS instructions (fallback for other browsers)
                <Card className="mb-6 bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-3">Comment installer sur iPhone ?</h3>
                  <ol className="text-blue-700 text-sm space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Appuyez sur le bouton de partage <SafariShareIcon /></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span>Appuyez sur <strong>"Ajouter a l'ecran d'accueil"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span>Appuyez sur <strong>"Ajouter"</strong></span>
                    </li>
                  </ol>
                </Card>
              ) : isInstallable ? (
                // Android/Desktop with install prompt
                <Button onClick={handleInstall} className="w-full mb-4">
                  Installer l'application
                </Button>
              ) : (
                // Not installable - show generic instructions
                <Card className="mb-6 bg-neutral-50">
                  <p className="text-neutral-600 text-sm text-center">
                    Si vous voyez deja l'icone Le Phare sur votre ecran d'accueil, c'est parfait !
                  </p>
                  <p className="text-neutral-500 text-xs text-center mt-2">
                    Sinon, utilisez le menu de votre navigateur pour "Ajouter a l'ecran d'accueil".
                  </p>
                </Card>
              )}
            </>
          )}

          {/* Visual preview */}
          <div className="flex justify-center mt-8">
            <div className="relative">
              <div className="w-20 h-20 bg-[#feefe1] rounded-2xl shadow-lg flex items-center justify-center">
                <img src="/apple-touch-icon.png" alt="Le Phare" className="w-16 h-16 rounded-xl" />
              </div>
              <span className="block text-center text-sm text-neutral-600 mt-2">LE PHARE</span>
            </div>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            onClick={handleContinue}
            disabled={continueForm.processing}
            className="w-full"
          >
            {continueForm.processing ? 'Chargement...' : 'Continuer'}
          </Button>
        </div>
      </div>
    </>
  )
}
