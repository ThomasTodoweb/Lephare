import { Head, useForm, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

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
}

export default function Description({ publication, mission }: Props) {
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
  const isStory = publication.contentType === 'story'
  const mediaItems = publication.mediaItems?.length > 0 ? publication.mediaItems : [{ type: 'image' as const, path: publication.imagePath, order: 0 }]

  const getContentTypeLabel = () => {
    switch (publication.contentType) {
      case 'carousel':
        return 'Carrousel'
      case 'reel':
        return 'Reel'
      case 'story':
        return 'Story'
      default:
        return 'Post'
    }
  }

  const getContentTypeIcon = () => {
    switch (publication.contentType) {
      case 'carousel':
        return '🖼️'
      case 'reel':
        return '🎬'
      case 'story':
        return '📱'
      default:
        return '📷'
    }
  }

  return (
    <>
      <Head title="Description - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <Link href={mission ? `/missions/${mission.id}/photo` : '/missions'} className="text-primary text-sm mb-2 inline-block">
            ← Retour
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">{getContentTypeIcon()}</span>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Votre {getContentTypeLabel()}
            </h1>
          </div>
          {mission && (
            <p className="text-neutral-600">{mission.template.title}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-40 overflow-y-auto">
          {/* Media preview */}
          <div className="mb-6 relative">
            {isCarousel ? (
              <div className="relative">
                {mediaItems[currentSlide]?.type === 'video' ? (
                  <video
                    src={`/${mediaItems[currentSlide].path}`}
                    className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
                    controls
                  />
                ) : (
                  <img
                    src={`/${mediaItems[currentSlide]?.path}`}
                    alt={`Image ${currentSlide + 1}`}
                    className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
                  />
                )}
                {/* Carousel navigation */}
                {mediaItems.length > 1 && (
                  <>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {mediaItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentSlide(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentSlide ? 'bg-primary' : 'bg-white/70'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentSlide((c) => Math.max(0, c - 1))}
                      disabled={currentSlide === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentSlide((c) => Math.min(mediaItems.length - 1, c + 1))}
                      disabled={currentSlide === mediaItems.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-2 disabled:opacity-30"
                    >
                      →
                    </button>
                    <span className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                      {currentSlide + 1}/{mediaItems.length}
                    </span>
                  </>
                )}
              </div>
            ) : isReel ? (
              <div>
                <video
                  src={`/${mediaItems[0]?.path}`}
                  className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
                  controls
                />
                {publication.shareToFeed && (
                  <p className="text-sm text-neutral-600 mt-2 text-center">
                    ✓ Sera aussi partagé dans le feed
                  </p>
                )}
              </div>
            ) : (
              <img
                src={`/${publication.imagePath}`}
                alt="Votre photo"
                className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
              />
            )}
          </div>

          {/* AI indicator */}
          {publication.aiGeneratedCaption && (
            <Card className="mb-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                <p className="text-green-800 text-sm font-medium">
                  Description générée par IA
                </p>
              </div>
            </Card>
          )}

          {/* Caption editor */}
          <div className="mb-4">
            <label className="block text-sm font-bold text-neutral-900 mb-2">
              Légende Instagram
            </label>
            {isEditing ? (
              <div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-40 px-4 py-3 border-2 border-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Écrivez votre légende..."
                />
                <div className="flex gap-2 mt-2">
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
                    className="text-sm text-primary mt-2"
                  >
                    ↩ Revenir à la description IA
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="w-full min-h-[120px] px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl cursor-pointer hover:border-primary transition-colors"
              >
                <p className="text-neutral-800 whitespace-pre-wrap">
                  {caption || 'Appuyez pour ajouter une description...'}
                </p>
              </div>
            )}
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary font-medium"
            >
              ✏️ Modifier la description
            </button>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200">
          <Button
            onClick={handlePublish}
            disabled={publishForm.processing || isEditing || !caption.trim()}
            className="w-full"
          >
            {publishForm.processing ? 'Publication en cours...' : 'Publier sur Instagram'}
          </Button>
          {!caption.trim() && (
            <p className="text-center text-sm text-neutral-500 mt-2">
              Ajoutez une description pour publier
            </p>
          )}
        </div>
      </div>
    </>
  )
}
