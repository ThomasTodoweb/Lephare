import { Head, useForm, Link, usePage, router } from '@inertiajs/react'
import { useRef, useState, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import axios from 'axios'

interface Props {
  mission: {
    id: number
    template: {
      type: string
      title: string
      contentIdea: string
    }
  }
  contentType: 'post' | 'carousel' | 'reel' | 'story'
  maxImages: number
  acceptVideo: boolean
}

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
}

export default function MediaCapture({ mission, contentType, maxImages, acceptVideo }: Props) {
  const { flash } = usePage<{ flash?: { error?: string; success?: string } }>().props
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null)
  const [shareToFeed, setShareToFeed] = useState(true)
  const [isCompressing, setIsCompressing] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const form = useForm<{
    photo: File | null
    photos: File[]
    video: File | null
    cover: File | null
    shareToFeed: string
  }>({
    photo: null,
    photos: [],
    video: null,
    cover: null,
    shareToFeed: 'true',
  })

  const isCarousel = contentType === 'carousel'
  const isReel = contentType === 'reel'
  const isStory = contentType === 'story'

  // Compress image to reduce file size
  const compressImage = (file: File, maxWidth = 1920, quality = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let { width, height } = img

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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setIsCompressing(true)

    const newMediaFiles: MediaFile[] = [...mediaFiles]

    for (let i = 0; i < files.length; i++) {
      if (newMediaFiles.length >= maxImages) break

      const file = files[i]
      let processedFile = file

      // Compress if larger than 2MB
      if (file.size > 2 * 1024 * 1024) {
        processedFile = await compressImage(file)
      }

      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(processedFile)
      })

      newMediaFiles.push({ file: processedFile, preview, type: 'image' })
    }

    setMediaFiles(newMediaFiles)

    if (isCarousel) {
      form.setData('photos', newMediaFiles.map((m) => m.file))
    } else {
      form.setData('photo', newMediaFiles[0]?.file || null)
    }

    setIsCompressing(false)
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVideoError(null)
    setVideoLoading(true)

    // Verify it's a valid video file
    if (!file.type.startsWith('video/')) {
      setVideoError('Ce fichier n\'est pas une vidéo valide')
      setVideoLoading(false)
      return
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setVideoError('La vidéo est trop volumineuse (max 100 Mo)')
      setVideoLoading(false)
      return
    }

    const preview = URL.createObjectURL(file)
    setMediaFiles([{ file, preview, type: 'video' }])
    form.setData('video', file)
    setVideoLoading(false)
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let processedFile = file
    if (file.size > 2 * 1024 * 1024) {
      processedFile = await compressImage(file)
    }

    const preview = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(processedFile)
    })

    setCoverImage({ file: processedFile, preview })
    form.setData('cover', processedFile)
  }

  const removeMedia = (index: number) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index)
    setMediaFiles(newMediaFiles)

    if (isCarousel) {
      form.setData('photos', newMediaFiles.map((m) => m.file))
    } else if (newMediaFiles.length === 0) {
      form.setData('photo', null)
      form.setData('video', null)
    }
  }

  const handleChooseFromGallery = () => {
    if (acceptVideo) {
      videoInputRef.current?.click()
    } else {
      galleryInputRef.current?.click()
    }
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  // Get current file size
  const currentFileSize = mediaFiles[0]?.file?.size || 0

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    const formData = new FormData()

    // Add video or photo
    if (mediaFiles[0]?.type === 'video') {
      formData.append('video', mediaFiles[0].file)
    } else if (isCarousel) {
      mediaFiles.forEach((m) => formData.append('photos', m.file))
    } else if (mediaFiles[0]) {
      formData.append('photo', mediaFiles[0].file)
    }

    // Add cover image if present
    if (coverImage) {
      formData.append('cover', coverImage.file)
    }

    // Add share to feed option
    formData.append('shareToFeed', shareToFeed ? 'true' : 'false')

    try {
      const response = await axios.post(`/missions/${mission.id}/photo`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percent)
          }
        },
        // Timeout of 5 minutes for large videos
        timeout: 300000,
      })

      // Handle redirect from Inertia response
      if (response.data?.url) {
        router.visit(response.data.url)
      } else if (response.request?.responseURL) {
        router.visit(response.request.responseURL)
      }
    } catch (error: unknown) {
      console.error('Upload error:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setUploadError('La connexion a expiré. Vérifiez votre connexion internet et réessayez.')
        } else if (error.response?.status === 413) {
          setUploadError('Le fichier est trop volumineux. Essayez une vidéo plus courte.')
        } else {
          setUploadError(error.response?.data?.error || 'Erreur lors de l\'envoi. Veuillez réessayer.')
        }
      } else {
        setUploadError('Erreur lors de l\'envoi. Veuillez réessayer.')
      }
      setIsUploading(false)
    }
  }, [mediaFiles, coverImage, shareToFeed, mission.id, isCarousel])

  const getContentTypeLabel = () => {
    switch (contentType) {
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
    switch (contentType) {
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
      <Head title={`${getContentTypeLabel()} - Le Phare`} />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4">
          <Link href="/missions" className="text-primary text-sm mb-2 inline-block">
            ← Retour à la mission
          </Link>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{getContentTypeIcon()}</span>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              {getContentTypeLabel()}
            </h1>
          </div>
          <p className="text-neutral-600">{mission.template.title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 pb-32">
          {/* Error message */}
          {flash?.error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              {flash.error}
            </div>
          )}

          {/* Tip Card */}
          <Card className="mb-6 bg-neutral-50">
            <h3 className="font-bold text-neutral-900 mb-2">💡 Conseil</h3>
            <p className="text-neutral-700 text-sm">{mission.template.contentIdea}</p>
          </Card>

          {/* Content type info */}
          {isCarousel && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl text-blue-800 text-sm">
              📸 Sélectionnez jusqu'à 10 images pour votre carrousel
            </div>
          )}
          {isReel && (
            <div className="mb-4 p-3 bg-purple-50 rounded-xl text-purple-800 text-sm">
              🎬 Sélectionnez une vidéo pour votre reel (max 90s, format MP4 recommandé)
            </div>
          )}
          {(videoError || uploadError) && (
            <div className="mb-4 p-3 bg-red-50 rounded-xl text-red-700 text-sm">
              ⚠️ {videoError || uploadError}
            </div>
          )}
          {videoLoading && (
            <div className="mb-4 p-3 bg-blue-50 rounded-xl text-blue-700 text-sm">
              ⏳ Chargement de la vidéo...
            </div>
          )}
          {/* File size indicator for videos */}
          {mediaFiles[0]?.type === 'video' && currentFileSize > 0 && !isUploading && (
            <div className="mb-4 p-3 bg-neutral-50 rounded-xl text-neutral-600 text-sm">
              📁 Taille : {formatFileSize(currentFileSize)}
              {currentFileSize > 50 * 1024 * 1024 && (
                <span className="text-orange-600 ml-2">(fichier volumineux, l'envoi peut prendre du temps)</span>
              )}
            </div>
          )}
          {isStory && (
            <div className="mb-4 p-3 bg-pink-50 rounded-xl text-pink-800 text-sm">
              📱 Votre story sera visible pendant 24h
            </div>
          )}

          {/* Media preview */}
          <div className="mb-6">
            {mediaFiles.length > 0 ? (
              <div className={isCarousel ? 'grid grid-cols-2 gap-3' : ''}>
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'video' ? (
                      <video
                        src={media.preview}
                        className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-900"
                        controls
                        playsInline
                        preload="metadata"
                        onError={() => setVideoError('Impossible de lire cette vidéo. Essayez un autre format (MP4 recommandé).')}
                        onLoadedData={() => setVideoLoading(false)}
                      />
                    ) : (
                      <img
                        src={media.preview}
                        alt={`Aperçu ${index + 1}`}
                        className="w-full max-h-[50vh] object-contain rounded-2xl border-4 border-primary bg-neutral-100"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-lg"
                    >
                      ✕
                    </button>
                    {isCarousel && (
                      <span className="absolute bottom-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-sm">
                        {index + 1}/{mediaFiles.length}
                      </span>
                    )}
                  </div>
                ))}
                {isCarousel && mediaFiles.length < maxImages && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square bg-neutral-100 rounded-2xl border-4 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  >
                    <span className="text-3xl mb-2">➕</span>
                    <span className="text-sm text-neutral-600">Ajouter</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={handleChooseFromGallery}
                className="w-full aspect-[4/5] bg-neutral-100 rounded-2xl border-4 border-dashed border-neutral-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
              >
                <span className="text-5xl mb-4">{getContentTypeIcon()}</span>
                <p className="text-neutral-600 font-medium">
                  {acceptVideo ? 'Appuyez pour choisir une vidéo' : 'Appuyez pour choisir une photo'}
                </p>
                <p className="text-neutral-500 text-sm mt-1">ou utilisez les boutons ci-dessous</p>
              </div>
            )}
          </div>

          {/* Reel options */}
          {isReel && mediaFiles.length > 0 && (
            <div className="mb-6 space-y-4">
              {/* Cover image */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Image de couverture (optionnel)
                </label>
                {coverImage ? (
                  <div className="relative inline-block">
                    <img
                      src={coverImage.preview}
                      alt="Couverture"
                      className="w-24 h-24 object-cover rounded-xl border-2 border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null)
                        form.setData('cover', null)
                      }}
                      className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-24 h-24 bg-neutral-100 rounded-xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-500 hover:border-primary transition-colors"
                  >
                    <span className="text-xl">🖼️</span>
                    <span className="text-xs mt-1">Ajouter</span>
                  </button>
                )}
              </div>

              {/* Share to feed toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setShareToFeed(!shareToFeed)}
                  className={`w-12 h-7 rounded-full transition-colors ${
                    shareToFeed ? 'bg-primary' : 'bg-neutral-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-1 ${
                      shareToFeed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </div>
                <span className="text-neutral-700">Partager aussi dans le feed</span>
              </label>
            </div>
          )}

          {/* Hidden file inputs */}
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple={isCarousel}
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            className="hidden"
          />
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="hidden"
          />
        </div>

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-200 space-y-3">
          {isCompressing ? (
            <div className="text-center py-4">
              <p className="text-neutral-600">Optimisation des images...</p>
            </div>
          ) : isUploading ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-neutral-700 font-medium mb-2">
                  Envoi en cours... {uploadProgress}%
                </p>
                <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-neutral-500 text-sm mt-2">
                  {uploadProgress < 100 ? 'Ne fermez pas cette page' : 'Traitement en cours...'}
                </p>
              </div>
            </div>
          ) : mediaFiles.length > 0 ? (
            <Button onClick={handleSubmit} disabled={form.processing || isUploading} className="w-full">
              Continuer
            </Button>
          ) : (
            <>
              <Button onClick={handleChooseFromGallery} className="w-full">
                {acceptVideo ? 'Choisir une vidéo' : 'Choisir depuis la galerie'}
              </Button>
              {!acceptVideo && (
                <Button variant="outlined" onClick={handleTakePhoto} className="w-full">
                  Prendre une photo
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
