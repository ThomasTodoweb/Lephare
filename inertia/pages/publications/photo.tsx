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
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)

  const form = useForm<{ photo: File | null }>({
    photo: null,
  })

  // Compress image to reduce file size
  const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

          // Scale down if needed
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                resolve(file)
              }
            },
            'image/jpeg',
            quality
          )
        }
        img.src = e.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setIsCompressing(true)

      // Compress if larger than 2MB
      let processedFile = file
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file)
      }

      setSelectedFile(processedFile)
      form.setData('photo', processedFile)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setIsCompressing(false)
      }
      reader.readAsDataURL(processedFile)
    }
  }

  const handleChooseFromGallery = () => {
    galleryInputRef.current?.click()
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
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
                  className="w-full max-h-[70vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
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
                onClick={handleChooseFromGallery}
                className="w-full aspect-[4/5] bg-neutral-100 rounded-2xl border-4 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <span className="text-5xl mb-4">📷</span>
                <p className="text-neutral-600 font-medium">Appuyez pour choisir une photo</p>
                <p className="text-neutral-500 text-sm mt-1">ou utilisez les boutons ci-dessous</p>
              </div>
            )}
          </div>

          {/* Hidden file inputs - one for gallery, one for camera */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          {isCompressing ? (
            <div className="text-center py-4">
              <p className="text-neutral-600">Optimisation de l'image...</p>
            </div>
          ) : preview ? (
            <Button
              onClick={handleSubmit}
              disabled={form.processing}
              className="w-full"
            >
              {form.processing ? 'Chargement...' : 'Continuer'}
            </Button>
          ) : (
            <>
              <Button onClick={handleChooseFromGallery} className="w-full">
                Choisir depuis la galerie
              </Button>
              <Button variant="outlined" onClick={handleTakePhoto} className="w-full">
                Prendre une photo
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
