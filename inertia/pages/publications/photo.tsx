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
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="px-5 pt-8 pb-2 pwa-safe-area-top">
          <Link href="/missions" className="text-[13px] font-medium text-text-muted mb-4 inline-block hover:text-text-secondary transition-colors">
            &larr; Retour a la mission
          </Link>
          <h1 className="text-[20px] font-bold text-text tracking-tight">
            Ta photo
          </h1>
          <p className="text-[14px] text-text-secondary mt-1">
            {mission.template.title}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pb-36 pt-4">
          {/* Tip Card */}
          <Card variant="flat" padding="md" className="mb-5">
            <p className="text-[13px] font-medium text-text-secondary mb-1">Conseil</p>
            <p className="text-[14px] text-text leading-relaxed">{mission.template.contentIdea}</p>
          </Card>

          {/* Photo preview or placeholder */}
          <div className="mb-6">
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Apercu"
                  className="w-full max-h-[70vh] object-contain rounded-2xl border border-border bg-bg-subtle"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreview(null)
                    setSelectedFile(null)
                    form.setData('photo', null)
                  }}
                  className="absolute top-3 right-3 bg-bg-card rounded-full w-8 h-8 flex items-center justify-center shadow-card text-text-secondary hover:text-text transition-colors"
                >
                  <span className="text-[14px]">&times;</span>
                </button>
              </div>
            ) : (
              <div
                onClick={handleChooseFromGallery}
                className="w-full aspect-[4/5] bg-bg-subtle rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-text-muted transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-bg-card shadow-card flex items-center justify-center mb-4">
                  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" className="text-text-muted">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-[14px] font-medium text-text-secondary">Appuie pour choisir une photo</p>
                <p className="text-[12px] text-text-muted mt-1">JPG, PNG -- max 10 Mo</p>
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
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border">
          {isCompressing ? (
            <div className="text-center py-3">
              <p className="text-[14px] text-text-secondary">Optimisation de l'image...</p>
            </div>
          ) : preview ? (
            <Button
              onClick={handleSubmit}
              disabled={form.processing}
              loading={form.processing}
              fullWidth
            >
              Continuer
            </Button>
          ) : (
            <Button onClick={handleChooseFromGallery} fullWidth>
              Choisir une photo
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
