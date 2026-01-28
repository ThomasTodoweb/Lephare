import { Head, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react'

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
    shareToFeed: boolean
    coverImagePath: string | null
    caption: string
    aiGeneratedCaption: string | null
  }
  mission: {
    id: number
    template: {
      title: string
      type: string
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

export default function Description({ publication, mission, totalSteps = 3, currentStep = 3 }: Props) {
  const [caption, setCaption] = useState(publication.caption)
  const [isEditing, setIsEditing] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const saveForm = useForm({
    caption: caption,
  })

  const publishForm = useForm({})

  const handleSave = () => {
    saveForm.setData('caption', caption)
    saveForm.post(`/publications/${publication.id}/caption`, {
      preserveScroll: true,
      onSuccess: () => setIsEditing(false),
    })
  }

  const handlePublish = () => {
    publishForm.post(`/publications/${publication.id}/publish`)
  }

  const handleResetToAI = () => {
    if (publication.aiGeneratedCaption) {
      setCaption(publication.aiGeneratedCaption)
    }
  }

  const isCarousel = publication.contentType === 'carousel'
  const isReel = publication.contentType === 'reel'
  const mediaItems = publication.mediaItems?.length > 0 ? publication.mediaItems : [{ type: 'image' as const, path: publication.imagePath, order: 0 }]

  return (
    <>
      <Head title="Description - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 pwa-safe-area-top">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.visit(`/publications/${publication.id}/analysis`)}
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
              {mission?.template.title || 'Légende'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 pb-40 overflow-y-auto">
          {/* Media preview */}
          <div className="mb-6 relative">
            {isCarousel ? (
              <div className="relative">
                {mediaItems[currentSlide]?.type === 'video' ? (
                  <video
                    src={`/${mediaItems[currentSlide].path}`}
                    className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                    controls
                  />
                ) : (
                  <img
                    src={`/${mediaItems[currentSlide]?.path}`}
                    alt={`Image ${currentSlide + 1}`}
                    className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                  />
                )}
                {/* Carousel navigation */}
                {mediaItems.length > 1 && (
                  <>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {mediaItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${
                            idx === currentSlide ? 'bg-neutral-800' : 'bg-neutral-300'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))}
                      disabled={currentSlide === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-sm border border-neutral-200 disabled:opacity-30"
                    >
                      <ChevronLeft className="w-4 h-4 text-neutral-600" />
                    </button>
                    <button
                      onClick={() => setCurrentSlide((c) => Math.min(mediaItems.length - 1, c + 1))}
                      disabled={currentSlide === mediaItems.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-1.5 shadow-sm border border-neutral-200 disabled:opacity-30"
                    >
                      <ChevronRight className="w-4 h-4 text-neutral-600" />
                    </button>
                    <span className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                      {currentSlide + 1}/{mediaItems.length}
                    </span>
                  </>
                )}
              </div>
            ) : isReel ? (
              <div>
                <video
                  src={`/${mediaItems[0]?.path}`}
                  className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                  controls
                />
                {publication.shareToFeed && (
                  <p className="text-xs text-neutral-500 mt-2 text-center">
                    Sera aussi partagé dans le feed
                  </p>
                )}
              </div>
            ) : (
              <img
                src={`/${publication.imagePath}`}
                alt="Votre photo"
                className="w-full max-h-48 object-contain rounded-lg border border-neutral-200 bg-neutral-50"
              />
            )}
          </div>

          {/* Caption editor */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Légende Instagram
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-40 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none text-sm"
                  placeholder="Écrivez votre légende..."
                />
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleSave}
                    disabled={saveForm.processing}
                    className="flex-1"
                  >
                    {saveForm.processing ? '...' : 'Enregistrer'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setCaption(publication.caption)
                      setIsEditing(false)
                    }}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                </div>
                {publication.aiGeneratedCaption && caption !== publication.aiGeneratedCaption && (
                  <button
                    type="button"
                    onClick={handleResetToAI}
                    className="text-sm text-neutral-500 hover:text-neutral-700 mt-3"
                  >
                    Revenir à la description IA
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="w-full min-h-[120px] px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg cursor-pointer hover:border-neutral-300 transition-colors"
              >
                <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {caption || 'Appuyez pour ajouter une description...'}
                </p>
              </div>
            )}
          </div>

          {/* AI indicator & edit link */}
          {!isEditing && (
            <div className="flex items-center gap-3 text-sm">
              {publication.aiGeneratedCaption && (
                <span className="text-neutral-400">Généré par IA</span>
              )}
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-primary hover:text-primary-dark"
              >
                Modifier
              </button>
            </div>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100">
          <Button
            onClick={handlePublish}
            disabled={publishForm.processing || isEditing || !caption.trim()}
            className="w-full"
          >
            {publishForm.processing ? 'Publication en cours...' : 'Publier'}
          </Button>
          {!caption.trim() && (
            <p className="text-center text-xs text-neutral-400 mt-2">
              Ajoutez une description pour publier
            </p>
          )}
        </div>
      </div>
    </>
  )
}
