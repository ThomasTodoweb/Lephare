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
      <Head title="Connectez Instagram - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Connectez Instagram
          </h1>
          <p className="text-neutral-600 mt-2">
            Pour publier directement depuis Le Phare, connectez votre compte Instagram professionnel.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {isConnected ? (
            // Connected state - show profile picture
            <>
              <Card className="border-green-500 bg-green-50 mb-4">
                <div className="flex items-center gap-4">
                  {instagramProfilePicture ? (
                    <img
                      src={instagramProfilePicture}
                      alt={instagramUsername || 'Instagram'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-green-500"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800">Compte connecté !</h3>
                    <p className="text-green-600 text-sm font-medium">@{instagramUsername}</p>
                  </div>
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </Card>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={disconnectForm.processing}
                className="text-sm text-neutral-500 hover:text-red-600 underline"
              >
                {disconnectForm.processing ? 'Déconnexion...' : 'Changer de compte Instagram'}
              </button>
            </>
          ) : (
            // Not connected state
            <>
              <Card className="mb-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-neutral-900">Pourquoi connecter Instagram ?</h3>
                    <ul className="text-neutral-600 text-sm mt-2 space-y-1">
                      <li>• Publiez en un clic depuis Le Phare</li>
                      <li>• Recevez des idées adaptées à votre style</li>
                      <li>• Suivez vos statistiques facilement</li>
                    </ul>
                  </div>
                </div>
              </Card>

              {/* WebView/PWA warning and alternative connection method */}
              {isWebView ? (
                <div className="space-y-4">
                  <Card className="bg-amber-50 border-amber-200">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">⚠️</span>
                      <div>
                        <h3 className="font-bold text-amber-800">
                          {isPWA ? 'Application installée' : 'Navigateur intégré détecté'}
                        </h3>
                        <p className="text-sm text-amber-700 mt-1">
                          {isPWA
                            ? 'Pour connecter Instagram, vous devez ouvrir ce lien dans Safari ou Chrome.'
                            : 'La connexion Instagram ne fonctionne pas dans ce navigateur. Veuillez ouvrir le lien dans Safari ou Chrome.'}
                        </p>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    <Button onClick={handleOpenInBrowser} className="w-full flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Ouvrir dans le navigateur
                    </Button>
                    <Button
                      onClick={handleCopyLink}
                      variant="outlined"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          Lien copié !
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copier le lien
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-neutral-400 text-center">
                    Collez le lien dans Safari ou Chrome pour vous connecter
                  </p>
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleConnect}
                    className="w-full mb-4 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                    </svg>
                    Connecter Instagram
                  </Button>

                  <div className="text-center">
                    <p className="text-neutral-500 text-sm">
                      Vos données sont sécurisées et ne sont jamais partagées.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          {isConnected ? (
            <Button
              onClick={handleContinue}
              disabled={continueForm.processing}
              className="w-full"
            >
              {continueForm.processing ? 'Chargement...' : 'Continuer'}
            </Button>
          ) : (
            <Button
              variant="outlined"
              onClick={handleSkip}
              disabled={skipForm.processing}
              className="w-full"
            >
              {skipForm.processing ? 'Chargement...' : 'Plus tard'}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
