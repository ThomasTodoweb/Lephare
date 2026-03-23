import { Head, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { ArrowLeft, Pencil, Sparkles } from 'lucide-react'
import InstagramPreview from '~/components/features/publications/InstagramPreview'
import { CaptionAnalyzer } from '~/components/features/celebrations/CaptionAnalyzer'

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
  instagramAccount: {
    username: string
    profilePictureUrl: string | null
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

export default function Description({ publication, mission, instagramAccount, totalSteps = 3, currentStep = 3 }: Props) {
  const [caption, setCaption] = useState(publication.caption)
  const [isEditing, setIsEditing] = useState(false)

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

  const mediaItems = publication.mediaItems?.length > 0 ? publication.mediaItems : [{ type: 'image' as const, path: publication.imagePath, order: 0 }]

  return (
    <>
      <Head title="Description - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 pwa-safe-area-top">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.visit(`/publications/${publication.id}/analysis`)}
              className="p-2 -ml-2 text-text-muted hover:text-text transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[13px] font-medium text-text-muted">
              {currentStep}/{totalSteps}
            </span>
          </div>

          <h1 className="text-[20px] font-bold text-text tracking-tight">
            Legende
          </h1>
        </div>

        {/* Content Type Badge + Title */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="bg-text text-white px-2.5 py-1 rounded-lg text-[12px] font-semibold tracking-wide">
              {CONTENT_TYPE_LABELS[publication.contentType] || 'POST'}
            </span>
            <span className="text-[14px] text-text-secondary">
              {mission?.template.title || 'Legende'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-2 pb-44 overflow-y-auto">
          {/* Instagram Preview */}
          {!isEditing && (
            <div className="mb-4">
              <InstagramPreview
                username={instagramAccount?.username || null}
                profilePictureUrl={instagramAccount?.profilePictureUrl || null}
                mediaItems={mediaItems}
                contentType={publication.contentType}
                caption={caption}
                onCaptionClick={() => setIsEditing(true)}
              />
            </div>
          )}

          {/* Caption editor (shown when editing) */}
          {isEditing && (
            <div className="mb-4">
              <label className="block text-[13px] font-medium text-text-secondary mb-2">
                Modifier la legende
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-48 px-4 py-3 bg-bg-card border border-border rounded-xl focus:outline-none focus:border-text focus:ring-1 focus:ring-text/20 resize-none text-[14px] text-text placeholder:text-text-muted"
                placeholder="Ecrivez votre legende..."
                autoFocus
              />
              <CaptionAnalyzer caption={caption} />
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={handleSave}
                  disabled={saveForm.processing}
                  loading={saveForm.processing}
                  fullWidth
                >
                  Enregistrer
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setCaption(publication.caption)
                    setIsEditing(false)
                  }}
                  fullWidth
                >
                  Annuler
                </Button>
              </div>
              {publication.aiGeneratedCaption && caption !== publication.aiGeneratedCaption && (
                <button
                  type="button"
                  onClick={handleResetToAI}
                  className="flex items-center gap-1.5 text-[13px] text-text-muted hover:text-text-secondary mt-3 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Revenir a la description IA
                </button>
              )}
            </div>
          )}

          {/* Edit button (shown below preview when not editing) */}
          {!isEditing && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[13px]">
                {publication.aiGeneratedCaption && (
                  <span className="flex items-center gap-1 text-text-muted">
                    <Sparkles className="w-3.5 h-3.5" />
                    Genere par IA
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-[13px] text-text font-medium hover:text-text-secondary transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier la legende
              </button>
            </div>
          )}
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border">
          <Button
            onClick={handlePublish}
            disabled={publishForm.processing || isEditing || !caption.trim()}
            loading={publishForm.processing}
            fullWidth
          >
            {publishForm.processing ? 'Publication en cours...' : 'Publier'}
          </Button>
          {!caption.trim() && (
            <p className="text-center text-[12px] text-text-muted mt-2">
              Ajoutez une description pour publier
            </p>
          )}
        </div>
      </div>
    </>
  )
}
