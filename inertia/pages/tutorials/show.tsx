import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Tutorial {
  id: number
  title: string
  description: string | null
  videoUrl: string | null
  contentText: string | null
  durationMinutes: number
  categoryName: string | null
  categorySlug: string | null
}

interface Props {
  tutorial: Tutorial
  isCompleted: boolean
  feedback: 'useful' | 'not_useful' | null
}

export default function TutorialShow({ tutorial, isCompleted, feedback }: Props) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const completeForm = useForm({})
  const feedbackForm = useForm({
    feedback: '' as 'useful' | 'not_useful',
  })

  const handleComplete = () => {
    if (!isCompleted) {
      completeForm.post(`/tutorials/${tutorial.id}/complete`, {
        onSuccess: () => {
          setShowFeedbackModal(true)
        },
      })
    }
  }

  const handleFeedback = (feedbackValue: 'useful' | 'not_useful') => {
    feedbackForm.setData('feedback', feedbackValue)
    feedbackForm.post(`/tutorials/${tutorial.id}/feedback`, {
      onSuccess: () => {
        setShowFeedbackModal(false)
      },
    })
  }

  // Parse markdown-like content to simple HTML
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-[17px] font-bold text-text mt-6 mb-2">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-[15px] font-semibold text-text mt-4 mb-2">{line.replace('### ', '')}</h3>
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-[14px] text-text-secondary ml-4">{line.replace('- ', '')}</li>
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="text-[14px] text-text-secondary ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>
        }
        if (line.trim() === '') {
          return <br key={i} />
        }
        return <p key={i} className="text-[14px] text-text-secondary leading-relaxed">{line}</p>
      })
  }

  return (
    <AppLayout>
      <Head title={`${tutorial.title} - Le Phare`} />

      {/* Header */}
      <div className="pt-4 pb-4">
        <Link href="/tutorials" className="inline-flex items-center gap-1 text-[13px] text-text-secondary mb-3">
          <ChevronLeft className="w-4 h-4" />
          Tutoriels
        </Link>
        {tutorial.categoryName && (
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-1">
            {tutorial.categoryName}
          </p>
        )}
        <h1 className="text-[20px] font-bold text-text">
          {tutorial.title}
        </h1>
        <p className="text-[13px] text-text-muted mt-1">
          {tutorial.durationMinutes} min
        </p>
      </div>

      {/* Content */}
      <div className="pb-40">
        {/* Video */}
        {tutorial.videoUrl && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-border">
            <div className="aspect-video bg-text flex items-center justify-center">
              {tutorial.videoUrl.match(/^https:\/\/(www\.)?(youtube\.com\/embed\/|youtube-nocookie\.com\/embed\/)[\w-]+/) ? (
                <iframe
                  src={tutorial.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
              ) : (
                <div className="text-center text-white">
                  <span className="text-[32px] block mb-2">▶</span>
                  <p className="text-[14px]">Vidéo non disponible</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {tutorial.description && (
          <Card variant="flat" className="mb-6">
            <p className="text-[14px] text-text-secondary leading-relaxed">{tutorial.description}</p>
          </Card>
        )}

        {/* Content text */}
        {tutorial.contentText && (
          <div className="space-y-1">
            {formatContent(tutorial.contentText)}
          </div>
        )}

        {/* Completion status */}
        {isCompleted && (
          <Card variant="bordered" className="mt-6 border-emerald-200 bg-emerald-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 text-[14px] font-bold">✓</span>
              </div>
              <div>
                <p className="text-[14px] font-semibold text-text">Tutoriel terminé</p>
                {feedback && (
                  <p className="text-[12px] text-text-secondary mt-0.5">
                    Votre avis : {feedback === 'useful' ? 'Utile' : 'Pas utile'}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-20 left-0 right-0 p-5 bg-bg border-t border-border">
        <div className="max-w-[430px] mx-auto">
          {isCompleted ? (
            <Link href="/tutorials" className="block">
              <Button variant="secondary" fullWidth>
                Retour aux tutoriels
              </Button>
            </Link>
          ) : (
            <Button
              onClick={handleComplete}
              loading={completeForm.processing}
              fullWidth
            >
              J'ai compris !
            </Button>
          )}
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-[17px] font-bold text-text mb-5 text-center">
              Ce tutoriel vous a-t-il été utile ?
            </h3>
            <div className="flex gap-3">
              <Button
                onClick={() => handleFeedback('useful')}
                loading={feedbackForm.processing}
                fullWidth
              >
                Oui, utile
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleFeedback('not_useful')}
                disabled={feedbackForm.processing}
                fullWidth
              >
                Pas vraiment
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="w-full mt-3 text-[13px] text-text-muted hover:text-text-secondary py-2"
            >
              Passer
            </button>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
