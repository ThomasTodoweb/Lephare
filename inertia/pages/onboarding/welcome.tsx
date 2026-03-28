import { Head, useForm } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { OnboardingProgress } from '~/components/OnboardingProgress'
import { Sparkles, Camera, TrendingUp } from 'lucide-react'

interface Props {
  step: number
  totalSteps: number
  videoUrl: string | null
}

export default function Welcome({ step, totalSteps }: Props) {
  const continueForm = useForm({})

  const handleContinue = () => {
    continueForm.post('/onboarding/welcome/continue')
  }

  return (
    <>
      <Head title="Bienvenue - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <OnboardingProgress currentStep={step} totalSteps={totalSteps} />

          {/* Popote welcome */}
          <div className="flex flex-col items-center text-center mt-6 mb-10">
            <div className="w-24 h-24 rounded-3xl bg-white shadow-lg flex items-center justify-center mb-5 animate-scale-in">
              <img src="/images/popote.png" alt="Popote" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-[24px] font-black text-text tracking-tight animate-fade-up">
              Salut, moi c'est Popote !
            </h1>
            <p className="text-[15px] text-text-secondary mt-3 leading-relaxed animate-fade-up max-w-[300px]" style={{ animationDelay: '100ms' }}>
              Je vais t'aider à faire briller ton restaurant sur Instagram. En 5 min par jour.
            </p>
          </div>

          {/* 3 promises — clean, no video */}
          <div className="space-y-3">
            {[
              { icon: Camera, title: 'Des missions quotidiennes', desc: 'On te dit quoi poster, tu prends la photo, c\'est fait.' },
              { icon: Sparkles, title: 'L\'IA écrit pour toi', desc: 'Popote analyse tes photos et rédige tes légendes.' },
              { icon: TrendingUp, title: 'Des résultats visibles', desc: 'Suis ta progression et vois l\'impact sur ton Instagram.' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3.5 bg-bg-card rounded-2xl p-4 shadow-xs animate-fade-up"
                style={{ animationDelay: `${200 + i * 80}ms` }}
              >
                <div className="w-10 h-10 rounded-xl bg-bg-subtle flex items-center justify-center flex-shrink-0">
                  <item.icon size={18} className="text-text" />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-text">{item.title}</p>
                  <p className="text-[13px] text-text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg">
          <div className="max-w-lg mx-auto">
            <Button variant="primary" fullWidth size="lg" loading={continueForm.processing} onClick={handleContinue}>
              On y va !
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
