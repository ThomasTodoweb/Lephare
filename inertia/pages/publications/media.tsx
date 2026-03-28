import { Head, useForm, Link, usePage, router } from '@inertiajs/react'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { Upload, X, Plus, Image, Film, Smartphone, Grid, Lightbulb, ChevronDown, ChevronUp, ChevronLeft, Check, Play, Volume2, VolumeX } from 'lucide-react'
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
  const videoCaptureInputRef = useRef<HTMLInputElement>(null)
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

  // Video playback state
  const [isMuted, setIsMuted] = useState(true)
  const previewVideoRef = useRef<HTMLVideoElement>(null)

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

  const handleChooseImageFromGallery = () => {
    galleryInputRef.current?.click()
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
  }

  const handleRecordVideo = () => {
    videoCaptureInputRef.current?.click()
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
          setUploadError('La connexion a expire. Verifie ta connexion internet et reessaie.')
        } else if (error.response?.status === 413) {
          setUploadError('Le fichier est trop volumineux. Essaie une video plus courte.')
        } else {
          setUploadError(error.response?.data?.error || 'Erreur lors de l\'envoi. Réessaie.')
        }
      } else {
        setUploadError('Erreur lors de l\'envoi. Réessaie.')
      }
      setIsUploading(false)
    }
  }, [mediaFiles, coverImage, shareToFeed, mission.id, isCarousel, selectedIdeaId])

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'carousel':
        return 'Album'
      case 'reel':
        return 'Vidéo courte'
      case 'story':
        return 'Story'
      default:
        return 'Photo'
    }
  }

  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'carousel':
        return <Grid className="w-5 h-5 text-text-muted" />
      case 'reel':
        return <Film className="w-5 h-5 text-text-muted" />
      case 'story':
        return <Smartphone className="w-5 h-5 text-text-muted" />
      default:
        return <Image className="w-5 h-5 text-text-muted" />
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
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="px-5 pt-8 pb-4 border-b border-border pwa-safe-area-top">
          <Link href="/missions" className="text-[13px] text-text-muted mb-4 inline-flex items-center gap-1 min-h-[44px] hover:text-text-secondary active:scale-[0.97] transition-all">
            <ChevronLeft className="w-4 h-4" /> Retour
          </Link>
          <h1 className="text-[24px] font-bold text-text tracking-tight mb-1">
            Ajouter ton {getContentTypeLabel().toLowerCase()}
          </h1>
          <p className="text-[13px] text-text-secondary">{mission.template.title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 py-5 pb-36">
          {/* Error messages as toasts */}
          {flash?.error && <Toast message={flash.error} type="error" />}
          {(videoError || uploadError) && (
            <div className="mb-4 p-3 bg-error-light border border-error/20 rounded-xl">
              <p className="text-error text-[13px]">
                {videoError || uploadError}
              </p>
            </div>
          )}

          {/* Media preview */}
          <div className="mb-6 animate-fade-up">
            {mediaFiles.length > 0 ? (
              <div className={isCarousel ? 'grid grid-cols-2 gap-3' : 'flex justify-center'}>
                {mediaFiles.map((media, index) => {
                  // Aspect ratio based on content type: 9:16 for stories/reels, 4:5 for posts
                  const aspectClass = (isReel || isStory) ? 'aspect-[9/16]' : 'aspect-[4/5]'

                  return (
                    <div
                      key={index}
                      className={`relative ${isCarousel ? '' : 'w-full max-w-xs'}`}
                    >
                      {media.type === 'video' ? (
                        <div
                          className={`relative ${aspectClass} bg-black rounded-2xl overflow-hidden cursor-pointer`}
                          onClick={() => {
                            if (previewVideoRef.current) {
                              previewVideoRef.current.muted = !previewVideoRef.current.muted
                              setIsMuted(!isMuted)
                            }
                          }}
                        >
                          <video
                            ref={previewVideoRef}
                            src={media.preview}
                            className="w-full h-full object-cover"
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            onError={() => setVideoError('Impossible de lire cette video. Essaie un autre format (MP4 recommande).')}
                            onLoadedData={() => setVideoLoading(false)}
                          />
                          {/* Sound indicator */}
                          <div className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2">
                            {isMuted ? (
                              <VolumeX className="w-4 h-4 text-white" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className={`relative ${aspectClass} bg-bg-subtle rounded-2xl overflow-hidden`}>
                          <img
                            src={media.preview}
                            alt={`Apercu ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMedia(index)
                        }}
                        className="absolute top-2.5 right-2.5 bg-bg-card/90 backdrop-blur-sm rounded-full p-1.5 shadow-card border border-border hover:bg-bg-subtle transition-colors"
                      >
                        <X className="w-4 h-4 text-text-secondary" />
                      </button>
                      {isCarousel && (
                        <span className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-lg text-[11px] font-medium">
                          {index + 1}/{mediaFiles.length}
                        </span>
                      )}
                    </div>
                  )
                })}
                {isCarousel && mediaFiles.length < maxImages && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-[4/5] bg-bg-subtle rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-text-muted transition-colors"
                  >
                    <Plus className="w-6 h-6 text-text-muted mb-1" />
                    <span className="text-[12px] text-text-muted">Ajouter</span>
                  </button>
                )}
              </div>
            ) : (
              <div
                onClick={isStory ? undefined : handleChooseFromGallery}
                className={`w-full max-w-xs mx-auto bg-bg-subtle rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center ${isStory ? '' : 'cursor-pointer hover:border-text-muted'} transition-colors ${(isReel || isStory) ? 'aspect-[9/16]' : 'aspect-[4/5]'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-bg-card shadow-card flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-text-muted" />
                </div>
                <p className="text-[14px] text-text-secondary font-medium">{getPlaceholderText()}</p>
                {getContentHint() && (
                  <p className="text-[12px] text-text-muted mt-1">{getContentHint()}</p>
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
                className="w-full flex items-center justify-between p-3 bg-bg-subtle rounded-xl text-text-secondary hover:bg-bg-card active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-[13px] font-medium">Besoin d'inspiration ?</span>
                </div>
                {showIdeas ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
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
                        className={`w-full overflow-hidden rounded-xl border-2 transition-all ${
                          selectedIdeaId === idea.id
                            ? 'border-text ring-2 ring-text/10'
                            : 'border-border hover:border-text-muted'
                        }`}
                      >
                        {idea.exampleMediaType === 'video' ? (
                          <div className="relative aspect-square bg-bg-subtle">
                            <video
                              src={`/${idea.exampleMediaPath}`}
                              className="w-full h-full object-cover"
                              muted
                              playsInline
                              preload="metadata"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                                <Play className="w-5 h-5 text-text ml-0.5" />
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
                          <div className="absolute top-2 right-2 w-6 h-6 bg-text rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Expanded view with details */}
                      {expandedIdeaId === idea.id && (
                        <Card variant="flat" padding="sm" className="mt-2">
                          <p className="text-[13px] text-text">{idea.suggestionText}</p>
                          {idea.photoTips && (
                            <p className="text-[12px] text-text-muted mt-1">
                              Conseil : {idea.photoTips}
                            </p>
                          )}
                        </Card>
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
                className="w-full flex items-center justify-between p-3 bg-bg-subtle rounded-xl text-text-secondary hover:bg-bg-card active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-[13px] font-medium">Besoin d'inspiration ?</span>
                </div>
                {showIdeas ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showIdeas && (
                <div className="mt-3 space-y-2">
                  {ideas.map((idea) => (
                    <button
                      key={idea.id}
                      type="button"
                      onClick={() => setSelectedIdeaId(selectedIdeaId === idea.id ? null : idea.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        selectedIdeaId === idea.id
                          ? 'border-text bg-bg-subtle'
                          : 'border-border bg-bg-card hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedIdeaId === idea.id
                            ? 'border-text bg-text'
                            : 'border-border'
                        }`}>
                          {selectedIdeaId === idea.id && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-[13px] text-text">{idea.suggestionText}</p>
                          {idea.photoTips && (
                            <p className="text-[12px] text-text-muted mt-1">
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
            <p className="text-[13px] text-text-muted text-center mb-6">
              {mission.template.contentIdea}
            </p>
          )}

          {/* Video loading indicator */}
          {videoLoading && (
            <p className="text-[13px] text-text-muted text-center mb-4">
              Chargement de la video...
            </p>
          )}

          {/* File size indicator for videos */}
          {mediaFiles[0]?.type === 'video' && currentFileSize > 0 && !isUploading && (
            <p className="text-[13px] text-text-muted text-center mb-4">
              Taille : {formatFileSize(currentFileSize)}
              {currentFileSize > 50 * 1024 * 1024 && (
                <span className="text-warning ml-1">(fichier volumineux)</span>
              )}
            </p>
          )}

          {/* Reel options */}
          {isReel && mediaFiles.length > 0 && (
            <div className="space-y-4 mb-6">
              {/* Cover image */}
              <div>
                <label className="block text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
                  Image de couverture (optionnel)
                </label>
                {coverImage ? (
                  <div className="relative inline-block">
                    <img
                      src={coverImage.preview}
                      alt="Couverture"
                      className="w-20 h-20 object-cover rounded-xl border border-border"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage(null)
                        form.setData('cover', null)
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-bg-card rounded-full p-0.5 shadow-card border border-border"
                    >
                      <X className="w-3 h-3 text-text-muted" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="w-20 h-20 bg-bg-subtle rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-text-muted hover:border-text-muted transition-colors"
                  >
                    <Image className="w-5 h-5" />
                    <span className="text-[11px] mt-1">Ajouter</span>
                  </button>
                )}
              </div>

              {/* Share to feed toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setShareToFeed(!shareToFeed)}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    shareToFeed ? 'bg-text' : 'bg-border'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform mt-0.5 ${
                      shareToFeed ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </div>
                <span className="text-[14px] text-text">Partager aussi dans le profil Instagram</span>
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
            ref={videoCaptureInputRef}
            type="file"
            accept="video/*"
            capture="environment"
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
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border space-y-3">
          {isCompressing ? (
            <p className="text-center text-[13px] text-text-muted py-3">
              Optimisation des images...
            </p>
          ) : isUploading ? (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-[14px] text-text mb-2">
                  Envoi en cours... {uploadProgress}%
                </p>
                <div className="w-full bg-bg-subtle rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-text h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[12px] text-text-muted mt-2">
                  {uploadProgress < 100 ? 'Ne ferme pas cette page' : 'Traitement en cours...'}
                </p>
              </div>
            </div>
          ) : mediaFiles.length > 0 ? (
            <Button onClick={handleSubmit} disabled={form.processing || isUploading} fullWidth>
              Continuer
            </Button>
          ) : isStory ? (
            /* Story: offer image gallery, video gallery, and direct video capture */
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={handleChooseImageFromGallery} icon={Image} fullWidth size="lg">
                  Photo
                </Button>
                <Button onClick={() => videoInputRef.current?.click()} icon={Film} fullWidth size="lg">
                  Video
                </Button>
              </div>
              <Button variant="secondary" onClick={handleRecordVideo} fullWidth>
                Filmer une video
              </Button>
            </>
          ) : acceptVideo ? (
            /* Reel: offer video gallery and direct video capture */
            <>
              <Button onClick={handleChooseFromGallery} fullWidth>
                Choisir une video
              </Button>
              <Button variant="secondary" onClick={handleRecordVideo} fullWidth>
                Filmer une video
              </Button>
            </>
          ) : (
            /* Post/Carousel: offer image gallery and camera */
            <>
              <Button onClick={handleChooseFromGallery} fullWidth>
                Choisir depuis la galerie
              </Button>
              <Button variant="secondary" onClick={handleTakePhoto} fullWidth>
                Prendre une photo
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
