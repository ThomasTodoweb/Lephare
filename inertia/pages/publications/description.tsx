import { Head, useForm, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Props {
  publication: {
    id: number
    imagePath: string
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

  return (
    <>
      <Head title="Description - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <Link href={mission ? `/missions/${mission.id}/photo` : '/missions'} className="text-primary text-sm mb-2 inline-block">
            ← Retour
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Votre description
          </h1>
          {mission && (
            <p className="text-neutral-600 mt-2">{mission.template.title}</p>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-40 overflow-y-auto">
          {/* Photo preview */}
          <div className="mb-6">
            <img
              src={`/${publication.imagePath}`}
              alt="Votre photo"
              className="w-full aspect-square object-cover rounded-2xl border-4 border-primary"
            />
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
