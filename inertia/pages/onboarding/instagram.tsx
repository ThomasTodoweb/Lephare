import { Head, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { ExternalLink, Copy, Check } from 'lucide-react'
import { useIsWebView } from '~/hooks/use_is_webview'

interface Props {
  isConnected: boolean
  instagramUsername: string | null
  instagramProfilePicture: string | null
  step: number
  totalSteps: number
}

export default function Instagram({ isConnected, instagramUsername, instagramProfilePicture, step = 5, totalSteps = 6 }: Props) {
  const skipForm = useForm({})
  const continueForm = useForm({})
  const disconnectForm = useForm({})
  const { isWebView, isPWA } = useIsWebView()
  const [copied, setCopied] = useState(false)

  const connectUrl = typeof window !== 'undefined' ? `${window.location.origin}/instagram/connect` : '/instagram/connect'

  const handleDisconnect = () => {
    disconnectForm.post('/instagram/disconnect')
  }

  const handleSkip = () => {
    skipForm.post('/onboarding/instagram/skip')
  }

  const handleContinue = () => {
    continueForm.post('/onboarding/instagram/continue')
  }

  // Direct connect - redirect immediately to Late OAuth
  const handleConnect = () => {
    window.location.href = '/instagram/connect'
  }

  const handleOpenInBrowser = () => {
    // Try to open in external browser
    window.open(connectUrl, '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(connectUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = connectUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <>
      <Head title="Connecte Instagram - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Connecte Instagram
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            Pour publier directement depuis Le Phare, connecte ton compte Instagram professionnel.
          </p>

          <div className="mt-6">
            {isConnected ? (
              // Connected state
              <>
                <Card className="border border-green-200 bg-green-50/50">
                  <div className="flex items-center gap-3.5">
                    {instagramProfilePicture ? (
                      <img
                        src={instagramProfilePicture}
                        alt={instagramUsername || 'Instagram'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-text">Compte connecte</p>
                      <p className="text-[13px] text-text-secondary">@{instagramUsername}</p>
                    </div>
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                    </div>
                  </div>
                </Card>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={disconnectForm.processing}
                  className="mt-3 text-[13px] text-text-muted hover:text-error transition-colors min-h-11 px-4"
                >
                  {disconnectForm.processing ? 'Deconnexion...' : 'Changer de compte'}
                </button>
              </>
            ) : (
              // Not connected state
              <>
                <Card variant="flat" className="mb-5">
                  <h3 className="text-[14px] font-semibold text-text mb-2">Pourquoi connecter Instagram ?</h3>
                  <ul className="text-[13px] text-text-secondary space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Publie en un clic depuis Le Phare</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Recois des idees adaptees a ton style</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-text-muted mt-0.5">--</span>
                      <span>Suis tes statistiques facilement</span>
                    </li>
                  </ul>
                </Card>

                {/* WebView/PWA warning and alternative connection method */}
                {isWebView ? (
                  <div className="space-y-3">
                    <Card variant="flat" className="bg-amber-50">
                      <div className="flex items-start gap-3">
                        <span className="text-[18px]">!</span>
                        <div>
                          <h3 className="text-[14px] font-semibold text-text">
                            {isPWA ? 'Application installee' : 'Navigateur integre detecte'}
                          </h3>
                          <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                            {isPWA
                              ? 'Pour connecter Instagram, tu dois ouvrir ce lien dans Safari ou Chrome.'
                              : 'La connexion Instagram ne fonctionne pas dans ce navigateur. Ouvre le lien dans Safari ou Chrome.'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <Button
                      variant="primary"
                      fullWidth
                      icon={ExternalLink}
                      onClick={handleOpenInBrowser}
                    >
                      Ouvrir dans le navigateur
                    </Button>
                    <Button
                      variant="secondary"
                      fullWidth
                      icon={copied ? Check : Copy}
                      onClick={handleCopyLink}
                    >
                      {copied ? 'Lien copie !' : 'Copier le lien'}
                    </Button>

                    <p className="text-[12px] text-text-muted text-center">
                      Colle le lien dans Safari ou Chrome pour te connecter
                    </p>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleConnect}
                    >
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                      Connecter Instagram
                    </Button>

                    <p className="text-[12px] text-text-muted text-center mt-3">
                      Tes donnees sont securisees et ne sont jamais partagees.
                    </p>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto">
            {isConnected ? (
              <Button
                variant="primary"
                fullWidth
                loading={continueForm.processing}
                onClick={handleContinue}
              >
                Continuer
              </Button>
            ) : (
              <Button
                variant="secondary"
                fullWidth
                loading={skipForm.processing}
                onClick={handleSkip}
              >
                Plus tard
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
