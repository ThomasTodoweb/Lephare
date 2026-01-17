import { Head, useForm, Link } from '@inertiajs/react'
import { useRef, useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

interface Props {
  mission: {
    id: number
    template: {
      type: string
      title: string
      contentIdea: string
    }
  }
}

export default function PhotoCapture({ mission }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const form = useForm<{ photo: File | null }>({
    photo: null,
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      form.setData('photo', file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChoosePhoto = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFile) {
      form.post(`/missions/${mission.id}/photo`, {
        forceFormData: true,
      })
    }
  }

  return (
    <>
      <Head title="Prendre une photo - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <Link href="/missions" className="text-primary text-sm mb-2 inline-block">
            ← Retour à la mission
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Votre photo
          </h1>
          <p className="text-neutral-600 mt-2">
            {mission.template.title}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {/* Tip Card */}
          <Card className="mb-6 bg-neutral-50">
            <h3 className="font-bold text-neutral-900 mb-2">💡 Conseil</h3>
            <p className="text-neutral-700 text-sm">{mission.template.contentIdea}</p>
          </Card>

          {/* Photo preview or placeholder */}
          <div className="mb-6">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Aperçu"
                  className="w-full aspect-square object-cover rounded-2xl border-4 border-primary"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setSelectedFile(null)
                    form.setData('photo', null)
                  }}
                  className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div
                onClick={handleChoosePhoto}
                className="w-full aspect-square bg-neutral-100 rounded-2xl border-4 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <span className="text-5xl mb-4">📷</span>
                <p className="text-neutral-600 font-medium">Appuyez pour choisir une photo</p>
                <p className="text-neutral-500 text-sm mt-1">ou prendre depuis la caméra</p>
              </div>
            )}
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          {preview ? (
            <Button
              onClick={handleSubmit}
              disabled={form.processing}
              className="w-full"
            >
              {form.processing ? 'Chargement...' : 'Continuer'}
            </Button>
          ) : (
            <>
              <Button onClick={handleChoosePhoto} className="w-full">
                Choisir une photo
              </Button>
              <Button variant="outlined" onClick={handleChoosePhoto} className="w-full">
                Prendre une photo
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
