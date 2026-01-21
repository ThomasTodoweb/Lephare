import { Head, Link, useForm } from '@inertiajs/react'
import { useState } from 'react'
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

const CATEGORY_ICONS: Record<string, string> = {
  post: '📸',
  story: '📱',
  reel: '🎬',
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
          return <h2 key={i} className="text-lg font-bold text-neutral-900 mt-6 mb-2">{line.replace('## ', '')}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-base font-bold text-neutral-800 mt-4 mb-2">{line.replace('### ', '')}</h3>
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="text-neutral-700 ml-4">{line.replace('- ', '')}</li>
        }
        if (line.match(/^\d+\. /)) {
          return <li key={i} className="text-neutral-700 ml-4 list-decimal">{line.replace(/^\d+\. /, '')}</li>
        }
        if (line.trim() === '') {
          return <br key={i} />
        }
        return <p key={i} className="text-neutral-700">{line}</p>
      })
  }

  return (
    <AppLayout currentPage="tutorials">
      <Head title={`${tutorial.title} - Le Phare`} />
      {/* Header */}
      <div className="pb-4">
        <Link href="/tutorials" className="text-primary text-sm mb-2 inline-block">
          ← Retour aux tutoriels
        </Link>
        <div className="flex items-center gap-2 mb-2">
          {tutorial.categorySlug && (
            <span className="text-2xl">{CATEGORY_ICONS[tutorial.categorySlug] || '📚'}</span>
          )}
          {tutorial.categoryName && (
            <span className="text-xs font-bold text-primary uppercase">{tutorial.categoryName}</span>
          )}
        </div>
        <h1 className="text-xl font-extrabold text-neutral-900">
          {tutorial.title}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          ⏱ {tutorial.durationMinutes} min
        </p>
      </div>

      {/* Content */}
      <div className="pb-40">
          {/* Video */}
          {tutorial.videoUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden border-4 border-primary">
              <div className="aspect-video bg-neutral-900 flex items-center justify-center">
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
                    <span className="text-5xl block mb-2">▶</span>
                    <p>Vidéo non disponible</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {tutorial.description && (
            <Card className="mb-6 bg-neutral-50">
              <p className="text-neutral-700">{tutorial.description}</p>
            </Card>
          )}

          {/* Content text */}
          {tutorial.contentText && (
            <div className="prose prose-sm max-w-none">
              {formatContent(tutorial.contentText)}
            </div>
          )}

          {/* Completion status */}
          {isCompleted && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">✓</span>
                <div>
                  <p className="font-bold text-green-800">Tutoriel terminé !</p>
                  {feedback && (
                    <p className="text-sm text-green-700">
                      Votre avis : {feedback === 'useful' ? '👍 Utile' : '👎 Pas utile'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

        </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-20 left-0 right-0 p-6 bg-background border-t border-neutral-200">
        {isCompleted ? (
          <Link href="/tutorials" className="block">
            <Button className="w-full" variant="outlined">
              Retour aux tutoriels
            </Button>
          </Link>
        ) : (
          <Button
            onClick={handleComplete}
            disabled={completeForm.processing}
            className="w-full"
          >
            {completeForm.processing ? 'Chargement...' : "J'ai compris !"}
          </Button>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <Card className="w-full max-w-sm">
            <h3 className="text-lg font-bold text-neutral-900 mb-4 text-center">
              Ce tutoriel vous a-t-il été utile ?
            </h3>
            <div className="flex gap-3">
              <Button
                onClick={() => handleFeedback('useful')}
                disabled={feedbackForm.processing}
                className="flex-1"
              >
                👍 Oui
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleFeedback('not_useful')}
                disabled={feedbackForm.processing}
                className="flex-1"
              >
                👎 Non
              </Button>
            </div>
            <button
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="w-full mt-3 text-sm text-neutral-500 hover:text-neutral-700"
            >
              Passer
            </button>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
