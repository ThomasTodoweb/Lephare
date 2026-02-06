import { Head, useForm, router } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { ArrowLeft, Pencil, Sparkles } from 'lucide-react'
import InstagramPreview from '~/components/features/publications/InstagramPreview'

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
        <div className="flex-1 px-4 py-4 pb-40 overflow-y-auto">
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
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Modifier la légende
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-48 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none text-sm"
                placeholder="Écrivez votre légende..."
                autoFocus
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
                  className="flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-700 mt-3"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Revenir à la description IA
                </button>
              )}
            </div>
          )}

          {/* Edit button (shown below preview when not editing) */}
          {!isEditing && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {publication.aiGeneratedCaption && (
                  <span className="flex items-center gap-1 text-neutral-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    Généré par IA
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-dark font-medium"
              >
                <Pencil className="w-3.5 h-3.5" />
                Modifier la légende
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
