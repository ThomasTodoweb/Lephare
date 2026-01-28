import { Head, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { Play } from 'lucide-react'

interface Props {
  step: number
  totalSteps: number
  videoUrl: string | null
}

export default function Welcome({ step, totalSteps, videoUrl }: Props) {
  const continueForm = useForm({})
  const [videoPlayed, setVideoPlayed] = useState(false)

  const handleContinue = () => {
    continueForm.post('/onboarding/welcome/continue')
  }

  // Default video URL if none configured
  const embedUrl = videoUrl || 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'

  return (
    <>
      <Head title="Bienvenue - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Bienvenue sur Le Phare !
          </h1>
          <p className="text-neutral-600 mt-2">
            Regardez cette courte vidéo pour découvrir comment booster votre restaurant sur Instagram.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {/* Video */}
          <Card className="mb-6 overflow-hidden p-0">
            <div className="aspect-video bg-neutral-900 flex items-center justify-center relative">
              {embedUrl.match(/^https:\/\/(www\.)?(youtube\.com|youtube-nocookie\.com)\/embed\/[\w-]+(\?.*)?$/) ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  onLoad={() => setVideoPlayed(true)}
                />
              ) : (
                <div className="text-center text-white">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-neutral-400">Vidéo de formation non configurée</p>
                </div>
              )}
            </div>
          </Card>

          {/* Benefits */}
          <div className="space-y-3">
            <h2 className="font-bold text-neutral-900">Ce que vous allez apprendre :</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">1</span>
                <div>
                  <p className="font-medium text-neutral-900">Missions quotidiennes</p>
                  <p className="text-sm text-neutral-600">Des idées de publications adaptées à votre restaurant</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">2</span>
                <div>
                  <p className="font-medium text-neutral-900">Tutoriels pratiques</p>
                  <p className="text-sm text-neutral-600">Apprenez les meilleures techniques Instagram</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary text-xl">3</span>
                <div>
                  <p className="font-medium text-neutral-900">Suivi de progression</p>
                  <p className="text-sm text-neutral-600">Gagnez des XP et débloquez de nouveaux contenus</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            onClick={handleContinue}
            disabled={continueForm.processing}
            className="w-full"
          >
            {continueForm.processing ? 'Chargement...' : "C'est parti !"}
          </Button>
        </div>
      </div>
    </>
  )
}
