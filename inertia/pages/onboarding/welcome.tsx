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
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          <h1 className="text-[22px] font-bold text-text tracking-tight">
            Bienvenue sur Le Phare
          </h1>
          <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
            Regardez cette courte video pour decouvrir comment booster votre restaurant sur Instagram.
          </p>

          {/* Video */}
          <Card padding="none" className="mt-6 overflow-hidden">
            <div className="aspect-video bg-text flex items-center justify-center relative">
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
                  <Play className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="text-[14px] text-white/50">Video de formation non configuree</p>
                </div>
              )}
            </div>
          </Card>

          {/* Benefits */}
          <div className="mt-8 space-y-4">
            <h2 className="text-[15px] font-semibold text-text">Ce que vous allez apprendre</h2>
            <div className="space-y-3">
              {[
                { num: '1', title: 'Missions quotidiennes', desc: 'Des idees de publications adaptees a votre restaurant' },
                { num: '2', title: 'Tutoriels pratiques', desc: 'Apprenez les meilleures techniques Instagram' },
                { num: '3', title: 'Suivi de progression', desc: 'Gagnez des XP et debloquez de nouveaux contenus' },
              ].map((item) => (
                <div key={item.num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-bg-subtle flex items-center justify-center flex-shrink-0">
                    <span className="text-[13px] font-semibold text-text">{item.num}</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-text">{item.title}</p>
                    <p className="text-[13px] text-text-muted mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={continueForm.processing}
              onClick={handleContinue}
            >
              C'est parti !
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
