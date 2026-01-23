import { Head, router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import { Button, PopoteMessage } from '~/components/ui'
import { CheckCircle, AlertTriangle, XCircle, Loader2, HelpCircle, RotateCcw, ArrowLeft } from 'lucide-react'

interface MediaItem {
  type: 'image' | 'video'
  path: string
  order: number
}

interface Props {
  publication: {
    id: number
    imagePath: string
    contentType: 'post' | 'carousel' | 'reel' | 'story'
    mediaItems: MediaItem[]
    qualityScore: 'green' | 'yellow' | 'red' | null
    qualityFeedback: string | null
  }
  mission: {
    id: number
    template: {
      title: string
      type: string
      tutorialId: number | null
    }
  } | null
  totalSteps?: number
  currentStep?: number
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'POST',
  carousel: 'CAROUSEL',
  reel: 'REEL',
  story: 'STORY',
}

const SCORE_CONFIG = {
  green: {
    bg: 'bg-green-50',
    border: 'border-green-500',
    text: 'text-green-700',
    icon: CheckCircle,
    label: 'Parfait !',
    description: 'Votre média est prêt pour la publication.',
  },
  yellow: {
    bg: 'bg-amber-50',
    border: 'border-amber-500',
    text: 'text-amber-700',
    icon: AlertTriangle,
    label: 'Attention',
    description: 'Quelques points à améliorer, mais vous pouvez continuer.',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-500',
    text: 'text-red-700',
    icon: XCircle,
    label: 'À refaire',
    description: 'Ce média ne respecte pas les standards de qualité.',
  },
}

export default function MediaAnalysis({ publication, mission, totalSteps = 3, currentStep = 2 }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [score, setScore] = useState<'green' | 'yellow' | 'red' | null>(publication.qualityScore)
  const [feedback, setFeedback] = useState<string | null>(publication.qualityFeedback)
  const [error, setError] = useState<string | null>(null)

  // Run analysis on mount if not already done
  useEffect(() => {
    if (!score && !isAnalyzing) {
      runAnalysis()
    }
  }, [])

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // Get CSRF token from cookie and decode it
      const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1]
      const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie) : ''

      const response = await fetch(`/publications/${publication.id}/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': xsrfToken,
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const data = await response.json()
      setScore(data.score)
      setFeedback(data.feedback)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Impossible d\'analyser le média. Veuillez réessayer.')
      // Default to green to not block the user
      setScore('green')
      setFeedback('Analyse non disponible, vous pouvez continuer.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleContinue = () => {
    router.visit(`/publications/${publication.id}/description`)
  }

  const handleRetake = () => {
    if (mission) {
      router.visit(`/missions/${mission.id}/photo`)
    } else {
      router.visit('/missions')
    }
  }

  const handleHelp = () => {
    if (mission?.template.tutorialId) {
      router.visit(`/tutorials/${mission.template.tutorialId}`)
    }
  }

  const getPreviewUrl = () => {
    // Use first media item or fallback to imagePath
    const firstMedia = publication.mediaItems?.[0]
    return firstMedia ? `/${firstMedia.path}` : `/${publication.imagePath}`
  }

  const isVideo = publication.contentType === 'reel' ||
    (publication.mediaItems?.[0]?.type === 'video')

  const canContinue = score === 'green' || score === 'yellow'
  const config = score ? SCORE_CONFIG[score] : null

  return (
    <>
      <Head title="Analyse du média - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => mission ? router.visit(`/missions/${mission.id}/photo`) : router.visit('/dashboard')}
              className="p-2 -ml-2 text-neutral-500 hover:text-neutral-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black text-neutral-900 uppercase tracking-tight font-display">
              Mission du jour
            </h1>
            <span className="text-lg font-bold text-neutral-500">
              {currentStep}/{totalSteps}
            </span>
          </div>
        </div>

        {/* Content Type Badge + Title */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-3">
            <span className="bg-neutral-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold font-display tracking-wide">
              {CONTENT_TYPE_LABELS[publication.contentType] || 'POST'}
            </span>
            <span className="text-neutral-800 font-medium">
              {mission?.template.title || 'Analyse qualité'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 pb-40">
          {/* Media preview */}
          <div className="mb-6 flex justify-center">
            <div className="relative max-w-xs w-full">
              {isVideo ? (
                <video
                  src={getPreviewUrl()}
                  className="w-full aspect-[4/5] object-cover rounded-xl border border-neutral-200"
                  controls={false}
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={getPreviewUrl()}
                  alt="Aperçu"
                  className="w-full aspect-[4/5] object-cover rounded-xl border border-neutral-200"
                />
              )}

              {/* Score badge on image */}
              {config && !isAnalyzing && (
                <div className={`absolute top-3 right-3 ${config.bg} ${config.text} px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm`}>
                  <config.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
              )}

              {/* Loading overlay with Popote */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-white/90 rounded-xl flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white border-2 border-neutral flex items-center justify-center animate-bounce-subtle mb-3">
                    <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain p-1" />
                  </div>
                  <p className="text-neutral-600 font-medium">Popote analyse ton média...</p>
                  <p className="text-sm text-neutral-400 mt-1">Cela prend quelques secondes</p>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-red-600 text-sm text-center mb-4">{error}</p>
          )}

          {/* Analysis result with Popote */}
          {config && !isAnalyzing && (
            <div className="mb-6">
              <PopoteMessage
                message={feedback || config.description}
                variant={score === 'green' ? 'happy' : 'default'}
                size="md"
              />
              {/* Score badge */}
              <div className={`${config.bg} border ${config.border} rounded-xl p-3 mt-3 flex items-center gap-2`}>
                <config.icon className={`w-5 h-5 ${config.text}`} />
                <span className={`font-semibold ${config.text}`}>{config.label}</span>
              </div>
            </div>
          )}

          {/* Explanation for red score */}
          {score === 'red' && !isAnalyzing && (
            <div className="bg-neutral-50 rounded-xl p-4 mb-6">
              <p className="text-sm text-neutral-600">
                Pour obtenir les meilleurs résultats sur Instagram, votre média doit être de bonne qualité :
                luminosité correcte, image nette, bon cadrage.
              </p>
              {mission?.template.tutorialId && (
                <p className="text-sm text-neutral-600 mt-2">
                  Besoin d'aide ? Consultez le tutoriel associé à cette mission.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100 space-y-3">
          {isAnalyzing ? (
            <p className="text-center text-sm text-neutral-500 py-3">
              Veuillez patienter...
            </p>
          ) : canContinue ? (
            <Button onClick={handleContinue} className="w-full">
              Continuer
            </Button>
          ) : (
            <>
              <Button onClick={handleRetake} className="w-full flex items-center justify-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Recommencer
              </Button>
              {mission?.template.tutorialId && (
                <Button
                  variant="outlined"
                  onClick={handleHelp}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <HelpCircle className="w-4 h-4" />
                  Besoin d'aide ?
                </Button>
              )}
            </>
          )}

          {/* Option to continue anyway for yellow */}
          {score === 'yellow' && !isAnalyzing && (
            <p className="text-center text-xs text-neutral-400">
              Vous pouvez continuer malgré l'avertissement
            </p>
          )}
        </div>
      </div>
    </>
  )
}
