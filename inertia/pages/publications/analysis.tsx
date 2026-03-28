import { Head, router } from '@inertiajs/react'
import { useEffect, useState, useRef } from 'react'
import { Button, PopoteMessage } from '~/components/ui'
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, RotateCcw, ArrowLeft } from 'lucide-react'

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
  skipDescription?: boolean
}

const CONTENT_TYPE_LABELS: Record<string, string> = {
  post: 'PHOTO',
  carousel: 'ALBUM',
  reel: 'VIDÉO',
  story: 'STORY',
}

const SCORE_CONFIG = {
  green: {
    bg: 'bg-success-light',
    border: 'border-success/20',
    text: 'text-success',
    dot: 'bg-success',
    icon: CheckCircle,
    label: 'Parfait',
    description: 'Ton média est prêt pour la publication.',
  },
  yellow: {
    bg: 'bg-warning-light',
    border: 'border-warning/20',
    text: 'text-warning',
    dot: 'bg-warning',
    icon: AlertTriangle,
    label: 'Attention',
    description: 'Quelques points à améliorer, mais tu peux continuer.',
  },
  red: {
    bg: 'bg-error-light',
    border: 'border-error/20',
    text: 'text-error',
    dot: 'bg-error',
    icon: XCircle,
    label: 'À refaire',
    description: 'Ce média ne respecte pas les standards de qualité.',
  },
}

export default function MediaAnalysis({ publication, mission, totalSteps = 3, currentStep = 2, skipDescription = false }: Props) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [score, setScore] = useState<'green' | 'yellow' | 'red' | null>(publication.qualityScore)
  const [feedback, setFeedback] = useState<string | null>(publication.qualityFeedback)
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Run analysis on mount if not already done
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Intentionally run only on mount
  useEffect(() => {
    if (!score && !isAnalyzing) {
      runAnalysis()
    }

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  const runAnalysis = async () => {
    // Abort any previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

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
        signal,
      })

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse')
      }

      const data = await response.json()
      if (!signal.aborted) {
        setScore(data.score)
        setFeedback(data.feedback)
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return // Request was aborted, ignore silently
      }
      console.error('Analysis error:', err)
      if (!signal.aborted) {
        setError('Impossible d\'analyser le média. Réessaie.')
        // Default to green to not block the user
        setScore('green')
        setFeedback('Analyse non disponible, tu peux continuer.')
      }
    } finally {
      if (!signal.aborted) {
        setIsAnalyzing(false)
      }
    }
  }

  const handleContinue = () => {
    if (skipDescription) {
      // For stories, publish directly without description step
      handlePublish()
    } else {
      router.visit(`/publications/${publication.id}/description`)
    }
  }

  const handlePublish = () => {
    setIsPublishing(true)
    router.post(`/publications/${publication.id}/publish`)
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
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 pwa-safe-area-top">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => mission ? router.visit(`/missions/${mission.id}/photo`) : router.visit('/dashboard')}
              className="p-2.5 -ml-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text active:scale-[0.97] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[13px] font-medium text-text-muted">
              {currentStep}/{totalSteps}
            </span>
          </div>

          <h1 className="text-[24px] font-bold text-text tracking-tight">
            Analyse qualité
          </h1>
        </div>

        {/* Content Type Badge + Title */}
        <div className="px-5 pb-4 animate-fade-up">
          <div className="flex items-center gap-2.5">
            <span className="bg-text text-white px-2.5 py-1 rounded-lg text-[12px] font-semibold tracking-wide">
              {CONTENT_TYPE_LABELS[publication.contentType] || 'POST'}
            </span>
            <span className="text-[14px] text-text-secondary">
              {mission?.template.title || 'Analyse qualité'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-4 pb-44">
          {/* Media preview */}
          <div className="mb-6 flex justify-center animate-fade-up">
            <div className="relative max-w-xs w-full">
              {isVideo ? (
                <video
                  src={getPreviewUrl()}
                  className="w-full aspect-[4/5] object-cover rounded-2xl border border-border"
                  controls={false}
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={getPreviewUrl()}
                  alt="Aperçu"
                  className="w-full aspect-[4/5] object-cover rounded-2xl border border-border"
                />
              )}

              {/* Score badge on image */}
              {config && !isAnalyzing && (
                <div className={`absolute top-3 right-3 ${config.bg} border ${config.border} ${config.text} px-3 py-1.5 rounded-xl flex items-center gap-2`}>
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <span className="text-[13px] font-medium">{config.label}</span>
                </div>
              )}

              {/* Loading overlay */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-bg-card/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-bg-card shadow-card flex items-center justify-center animate-bounce-subtle mb-3">
                    <img src="/images/popote.png" alt="Popote" className="w-full h-full object-contain p-1.5" />
                  </div>
                  <p className="text-[14px] font-medium text-text">Popote analyse ton média...</p>
                  <p className="text-[12px] text-text-muted mt-1">Cela prend quelques secondes</p>
                </div>
              )}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <p className="text-error text-[13px] text-center mb-4">{error}</p>
          )}

          {/* Analysis result with Popote */}
          {config && !isAnalyzing && (
            <div className="mb-5">
              <PopoteMessage
                message={feedback || config.description}
                variant={score === 'green' ? 'happy' : 'default'}
                size="md"
              />
            </div>
          )}

          {/* Explanation for red score */}
          {score === 'red' && !isAnalyzing && (
            <div className="bg-bg-subtle rounded-xl p-4 mb-5">
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Pour obtenir les meilleurs résultats sur Instagram, ton média doit être de bonne qualité :
                luminosité correcte, image nette, bon cadrage.
              </p>
              {mission?.template.tutorialId && (
                <p className="text-[13px] text-text-secondary mt-2">
                  Besoin d'aide ? Consulte le tutoriel associé à cette mission.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border space-y-3">
          {isAnalyzing || isPublishing ? (
            <p className="text-center text-[13px] text-text-muted py-3">
              {isPublishing ? 'Publication en cours...' : 'Patiente un instant...'}
            </p>
          ) : canContinue ? (
            <Button onClick={handleContinue} disabled={isPublishing} loading={isPublishing} fullWidth>
              {skipDescription ? 'Publier la story' : 'Continuer'}
            </Button>
          ) : (
            <>
              <Button onClick={handleRetake} icon={RotateCcw} fullWidth>
                Recommencer
              </Button>
              {mission?.template.tutorialId && (
                <Button
                  variant="secondary"
                  onClick={handleHelp}
                  icon={HelpCircle}
                  fullWidth
                >
                  Besoin d'aide ?
                </Button>
              )}
            </>
          )}

          {/* Option to continue anyway for yellow */}
          {score === 'yellow' && !isAnalyzing && (
            <p className="text-center text-[12px] text-text-muted">
              Tu peux continuer malgré l'avertissement
            </p>
          )}
        </div>
      </div>
    </>
  )
}
