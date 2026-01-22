import { Head, useForm, Link, usePage, router } from '@inertiajs/react'
import { useRef, useState, useCallback } from 'react'
import { Button } from '~/components/ui/Button'
import { Upload, X, Plus, Image, Film, Smartphone, Grid, Lightbulb, ChevronDown, ChevronUp, Check, Play } from 'lucide-react'
import axios from 'axios'

interface ContentIdea {
  id: number
  suggestionText: string
  photoTips: string | null
  exampleMediaPath: string | null
  exampleMediaType: 'image' | 'video' | null
}

interface Props {
  mission: {
    id: number
    template: {
      type: string
      title: string
      contentIdea: string
      ideas?: ContentIdea[]
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

  // Content ideas state
  const ideas = mission.template.ideas || []
  const ideasWithMedia = ideas.filter((idea) => idea.exampleMediaPath)
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [showIdeas, setShowIdeas] = useState(ideasWithMedia.length > 0)
  const [expandedIdeaId, setExpandedIdeaId] = useState<number | null>(null)

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
        const img = new window.Image()
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
      setVideoError('Ce fichier n\'est pas une video valide')
      setVideoLoading(false)
      return
    }

    // Check file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setVideoError('La video est trop volumineuse (max 100 Mo)')
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

    // Add selected content idea if any
    if (selectedIdeaId) {
      formData.append('contentIdeaId', String(selectedIdeaId))
    }

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
          setUploadError('La connexion a expire. Verifiez votre connexion internet et reessayez.')
        } else if (error.response?.status === 413) {
          setUploadError('Le fichier est trop volumineux. Essayez une video plus courte.')
        } else {
          setUploadError(error.response?.data?.error || 'Erreur lors de l\'envoi. Veuillez reessayer.')
        }
      } else {
        setUploadError('Erreur lors de l\'envoi. Veuillez reessayer.')
      }
      setIsUploading(false)
    }
  }, [mediaFiles, coverImage, shareToFeed, mission.id, isCarousel, selectedIdeaId])

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
        return <Grid className="w-5 h-5 text-neutral-400" />
      case 'reel':
        return <Film className="w-5 h-5 text-neutral-400" />
      case 'story':
        return <Smartphone className="w-5 h-5 text-neutral-400" />
      default:
        return <Image className="w-5 h-5 text-neutral-400" />
    }
  }

  const getPlaceholderText = () => {
    if (acceptVideo) {
      return 'Selectionner une video'
    }
    if (isCarousel) {
      return 'Selectionner des images'
    }
    return 'Selectionner une image'
  }

  const getContentHint = () => {
    if (isCarousel) {
      return `Jusqu'a ${maxImages} images`
    }
    if (isReel) {
      return 'Video de 90 secondes max'
    }
    if (isStory) {
      return 'Visible pendant 24h'
    }
    return null
  }

  return (
    <>
      <Head title={`${getContentTypeLabel()} - Le Phare`} />
      <div className="min-h-screen bg-white flex flex-col">
        {/* Header */}
        <div className="px-6 pt-8 pb-4 border-b border-neutral-100">
          <Link href="/missions" className="text-neutral-500 text-sm mb-4 inline-flex items-center gap-1 hover:text-neutral-700">
            <span>←</span> Retour
          </Link>
          <h1 className="text-xl font-semibold text-neutral-900 mb-1">
            Ajouter votre {getContentTypeLabel().toLowerCase()}
          </h1>
          <p className="text-sm text-neutral-500">{mission.template.title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-6 pb-32">
          {/* Error messages */}
          {(flash?.error || videoError || uploadError) && (
            <p className="text-red-600 text-sm mb-4">
              {flash?.error || videoError || uploadError}
            </p>
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
                        className="w-full max-h-[50vh] object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                        controls
                        playsInline
                        preload="metadata"
                        onError={() => setVideoError('Impossible de lire cette video. Essayez un autre format (MP4 recommande).')}
                        onLoadedData={() => setVideoLoading(false)}
                      />
                    ) : (
                      <img
                        src={media.preview}
                        alt={`Apercu ${index + 1}`}
                        className="w-full max-h-[50vh] object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeMedia(index)}
                      className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 shadow-sm border border-neutral-200 hover:bg-neutral-50"
                    >
                      <X className="w-4 h-4 text-neutral-600" />
                    </button>
                    {isCarousel && (
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded text-xs">
                        {index + 1}/{mediaFiles.length}
                      </span>
                    )}
                  </div>
                ))}
                {isCarousel && mediaFiles.length < maxImages && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-300 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-neutral-400 mb-1" />
                    <span className="text-xs text-neutral-500">Ajouter</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={handleChooseFromGallery}
                className="w-full aspect-square max-w-sm mx-auto bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-300 transition-colors"
              >
                <Upload className="w-8 h-8 text-neutral-400 mb-3" />
                <p className="text-sm text-neutral-600 font-medium">{getPlaceholderText()}</p>
                {getContentHint() && (
                  <p className="text-xs text-neutral-400 mt-1">{getContentHint()}</p>
                )}
              </div>
            )}
          </div>

          {/* Visual Inspiration Section */}
          {ideasWithMedia.length > 0 && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowIdeas(!showIdeas)}
                className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-medium">Besoin d'inspiration ?</span>
                </div>
                {showIdeas ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showIdeas && (
                <div className="mt-3 grid grid-cols-2 gap-3">
                  {ideasWithMedia.map((idea) => (
                    <div key={idea.id} className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (expandedIdeaId === idea.id) {
                            setExpandedIdeaId(null)
                          } else {
                            setExpandedIdeaId(idea.id)
                          }
                          setSelectedIdeaId(selectedIdeaId === idea.id ? null : idea.id)
                        }}
                        className={`w-full overflow-hidden rounded-lg border-2 transition-all ${
                          selectedIdeaId === idea.id
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        {idea.exampleMediaType === 'video' ? (
                          <div className="relative aspect-square bg-neutral-100">
                            <video
                              src={`/${idea.exampleMediaPath}`}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                <Play className="w-5 h-5 text-neutral-700 ml-0.5" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={`/${idea.exampleMediaPath}`}
                            alt={idea.suggestionText}
                            className="w-full aspect-square object-cover"
                          />
                        )}
                        {selectedIdeaId === idea.id && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Expanded view with details */}
                      {expandedIdeaId === idea.id && (
                        <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-800">{idea.suggestionText}</p>
                          {idea.photoTips && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Conseil : {idea.photoTips}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fallback to text-only ideas if no media */}
          {ideasWithMedia.length === 0 && ideas.length > 0 && (
            <div className="mb-6">
              <button
                type="button"
                onClick={() => setShowIdeas(!showIdeas)}
                className="w-full flex items-center justify-between p-3 bg-amber-50 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  <span className="text-sm font-medium">Besoin d'inspiration ?</span>
                </div>
                {showIdeas ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {showIdeas && (
                <div className="mt-3 space-y-2">
                  {ideas.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => setSelectedIdeaId(selectedIdeaId === idea.id ? null : idea.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedIdeaId === idea.id
                          ? 'border-primary bg-primary/5'
                          : 'border-neutral-200 bg-white hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedIdeaId === idea.id
                            ? 'border-primary bg-primary'
                            : 'border-neutral-300'
                        }`}>
                          {selectedIdeaId === idea.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-neutral-800">{idea.suggestionText}</p>
                          {idea.photoTips && (
                            <p className="text-xs text-neutral-500 mt-1">
                              Conseil : {idea.photoTips}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conseil - texte discret (only show if no ideas available) */}
          {mediaFiles.length === 0 && ideas.length === 0 && mission.template.contentIdea && (
            <p className="text-sm text-neutral-500 text-center mb-6">
              {mission.template.contentIdea}
            </p>
          )}

          {/* Video loading indicator */}
          {videoLoading && (
            <p className="text-sm text-neutral-500 text-center mb-4">
              Chargement de la video...
            </p>
          )}

          {/* File size indicator for videos */}
          {mediaFiles[0]?.type === 'video' && currentFileSize > 0 && !isUploading && (
            <p className="text-sm text-neutral-500 text-center mb-4">
              Taille : {formatFileSize(currentFileSize)}
              {currentFileSize > 50 * 1024 * 1024 && (
                <span className="text-amber-600 ml-1">(fichier volumineux)</span>
              )}
            </p>
          )}

          {/* Reel options */}
          {isReel && mediaFiles.length > 0 && (
            <div className="space-y-4 mb-6">
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
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null)
                        form.setData('cover', null)
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-white rounded-full p-0.5 shadow-sm border border-neutral-200"
                    >
                      <X className="w-3 h-3 text-neutral-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-20 h-20 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:border-neutral-300 transition-colors"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-xs mt-1">Ajouter</span>
                  </button>
                )}
              </div>

              {/* Share to feed toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setShareToFeed(!shareToFeed)}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    shareToFeed ? 'bg-primary' : 'bg-neutral-200'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                      shareToFeed ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-sm text-neutral-700">Partager aussi dans le feed</span>
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
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-neutral-100 space-y-3">
          {isCompressing ? (
            <p className="text-center text-sm text-neutral-500 py-3">
              Optimisation des images...
            </p>
          ) : isUploading ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-neutral-700 mb-2">
                  Envoi en cours... {uploadProgress}%
                </p>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">
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
                {acceptVideo ? 'Choisir une video' : 'Choisir depuis la galerie'}
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
