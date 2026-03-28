import { Head, router, usePage } from '@inertiajs/react'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { LazyVideo } from '~/components/ui/LazyVideo'
import { MediaContextInput } from '~/components/MediaContextInput'
import { X, Plus, Image, Film, ArrowLeft, Volume2, VolumeX, SwitchCamera, Zap, ZapOff, Upload, BookOpen, ChevronRight } from 'lucide-react'
import axios from 'axios'

interface ContentIdea {
  id: number
  title: string | null
  suggestionText: string
  photoTips: string | null
  exampleMediaPath: string | null
  exampleMediaType: 'image' | 'video' | null
  updatedAt: string | null
}

interface Props {
  mission: {
    id: number
    template: {
      type: string
      title: string
      contentIdea: string
      thematicCategory: {
        id: number
        name: string
        icon: string | null
      } | null
      ideas: ContentIdea[]
      linkedTutorial: {
        id: number
        title: string
      } | null
    }
  }
  contentType: 'post' | 'carousel' | 'reel' | 'story'
  maxImages: number
  acceptVideo: boolean
  totalSteps: number
  currentStep: number
}

interface MediaFile {
  file: File
  preview: string
  type: 'image' | 'video'
}

const CONTENT_TYPE_CONFIG: Record<string, { label: string; description: string }> = {
  post: { label: 'POST', description: 'Photo pour ton feed Instagram' },
  carousel: { label: 'CARROUSEL', description: 'Plusieurs photos en carrousel' },
  reel: { label: 'REEL', description: 'Video courte et dynamique' },
  story: { label: 'STORY', description: 'Contenu ephemere 24h' },
}

export default function MissionPage({ mission, contentType, maxImages, acceptVideo, totalSteps = 3, currentStep = 1 }: Props) {
  const { flash } = usePage<{ flash?: { error?: string; success?: string } }>().props

  const typeConfig = CONTENT_TYPE_CONFIG[contentType] || CONTENT_TYPE_CONFIG.post
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null) // Unified media input for both images and videos
  const previewVideoRef = useRef<HTMLVideoElement>(null)

  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [coverImage, setCoverImage] = useState<{ file: File; preview: string } | null>(null)
  const [shareToFeed, setShareToFeed] = useState(true)
  const [isCompressing, setIsCompressing] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [userContext, setUserContext] = useState('')

  // Content ideas (inspiration only - no selection)
  const ideas = mission.template.ideas || []
  const ideasWithMedia = ideas.filter((idea) => idea.exampleMediaPath)

  // Cache-buster helper for idea media URLs
  const getIdeaMediaUrl = (idea: ContentIdea) => {
    const base = `/${idea.exampleMediaPath}`
    if (idea.updatedAt) {
      const timestamp = new Date(idea.updatedAt).getTime()
      return `${base}?v=${timestamp}`
    }
    return base
  }

  // Expanded idea for full view
  const [expandedIdeaId, setExpandedIdeaId] = useState<number | null>(null)

  // Video recording state (for iOS workaround using MediaRecorder)
  const [cameraOpen, setCameraOpen] = useState(false) // Camera preview open but not recording
  const [isRecording, setIsRecording] = useState(false) // Actually recording
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null)
  const liveVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])

  // Camera controls state
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment') // back or front camera
  const [flashMode, setFlashMode] = useState<'off' | 'on'>('off') // flash mode
  const [hasFlash, setHasFlash] = useState(false) // whether device supports flash/torch

  // Physical camera lenses (for devices with multiple back cameras)
  type CameraLens = { deviceId: string; label: string; type: 'ultrawide' | 'wide' | 'telephoto' | 'unknown' }
  const [availableLenses, setAvailableLenses] = useState<CameraLens[]>([])
  const [currentLensIndex, setCurrentLensIndex] = useState(0)

  const isCarousel = contentType === 'carousel'
  const isReel = contentType === 'reel'
  const isStory = contentType === 'story'

  // iOS PWA detection and video capture workaround
  const isIOSPWA = typeof window !== 'undefined' &&
    ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true) &&
    /iPhone|iPad|iPod/.test(navigator.userAgent)

  // State for iOS video capture recovery message
  const [showIOSRecoveryMessage, setShowIOSRecoveryMessage] = useState(false)

  // On mount, check if we're recovering from an iOS PWA video capture bug
  useEffect(() => {
    if (typeof window === 'undefined') return

    const pendingVideoCapture = sessionStorage.getItem('pendingVideoCapture')
    if (pendingVideoCapture && isIOSPWA) {
      const data = JSON.parse(pendingVideoCapture)
      if (data.missionId === mission.id) {
        setShowIOSRecoveryMessage(true)
        sessionStorage.removeItem('pendingVideoCapture')
      }
    }
  }, [mission.id, isIOSPWA])

  // Handle video button click - save state before opening picker on iOS PWA
  const handleVideoClick = () => {
    if (isIOSPWA) {
      sessionStorage.setItem('pendingVideoCapture', JSON.stringify({
        missionId: mission.id,
        timestamp: Date.now()
      }))
    }
    videoInputRef.current?.click()
  }

  // Clear pending video flag when video is successfully selected
  const clearPendingVideoFlag = () => {
    sessionStorage.removeItem('pendingVideoCapture')
  }

  // Aspect ratio based on content type
  const getAspectClass = () => {
    if (isReel || isStory) return 'aspect-[9/16]'
    return 'aspect-[4/5]'
  }

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
    if (!files || files.length === 0) return

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
    setIsCompressing(false)

    // Reset input to allow selecting same file again
    e.target.value = ''
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    setVideoError(null)
    setVideoLoading(true)

    console.log('Video file selected:', {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    // Check if it's a video - be more permissive for iOS
    const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.avi']
    const hasVideoExtension = videoExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )
    const hasVideoMimeType = file.type.startsWith('video/') || file.type === ''

    if (!hasVideoMimeType && !hasVideoExtension) {
      setVideoError('Ce fichier n\'est pas une video valide')
      setVideoLoading(false)
      e.target.value = ''
      return
    }

    // Check file size (max 100MB) - only if size is available
    if (file.size > 0 && file.size > 100 * 1024 * 1024) {
      setVideoError('La video est trop volumineuse (max 100 Mo)')
      setVideoLoading(false)
      e.target.value = ''
      return
    }

    try {
      const preview = URL.createObjectURL(file)
      setMediaFiles([{ file, preview, type: 'video' }])
      setVideoLoading(false)
      // Clear iOS pending video flag on success
      clearPendingVideoFlag()
    } catch (err) {
      console.error('Error creating video preview:', err)
      setVideoError('Erreur lors du chargement de la video')
      setVideoLoading(false)
    }

    // Reset input to allow selecting same file again
    e.target.value = ''
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
    e.target.value = ''
  }

  const removeMedia = (index: number) => {
    const newMediaFiles = mediaFiles.filter((_, i) => i !== index)
    setMediaFiles(newMediaFiles)
  }

  /**
   * Unified media change handler for single upload zone
   * Detects if file is image or video and processes accordingly
   */
  const handleUnifiedMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Detect file type
    const isVideo = file.type.startsWith('video/') ||
      ['.mp4', '.mov', '.m4v', '.webm', '.avi'].some(ext =>
        file.name.toLowerCase().endsWith(ext)
      )

    if (isVideo) {
      // Process as video
      setVideoError(null)
      setVideoLoading(true)

      // Check file size (max 100MB)
      if (file.size > 0 && file.size > 100 * 1024 * 1024) {
        setVideoError('La video est trop volumineuse (max 100 Mo)')
        setVideoLoading(false)
        e.target.value = ''
        return
      }

      try {
        const preview = URL.createObjectURL(file)
        setMediaFiles([{ file, preview, type: 'video' }])
        setVideoLoading(false)
        clearPendingVideoFlag()
      } catch (err) {
        console.error('Error creating video preview:', err)
        setVideoError('Erreur lors du chargement de la video')
        setVideoLoading(false)
      }
    } else {
      // Process as image
      setIsCompressing(true)

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

      // For single media types (story, reel), replace. For carousel, could append.
      if (isCarousel) {
        setMediaFiles([...mediaFiles, { file: processedFile, preview, type: 'image' }])
      } else {
        setMediaFiles([{ file: processedFile, preview, type: 'image' }])
      }
      setIsCompressing(false)
    }

    e.target.value = ''
  }

  const handleChooseMedia = () => {
    if (acceptVideo) {
      videoInputRef.current?.click()
    } else {
      galleryInputRef.current?.click()
    }
  }

  const handleTakePhoto = () => {
    cameraInputRef.current?.click()
  }

  const handleChooseImageFromGallery = () => {
    galleryInputRef.current?.click()
  }

  // Detect available camera lenses (physical cameras)
  const detectAvailableLenses = async (facing: 'environment' | 'user'): Promise<CameraLens[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter(d => d.kind === 'videoinput')

      // Filter by facing mode based on label (heuristic)
      const facingDevices = videoDevices.filter(d => {
        const label = d.label.toLowerCase()
        if (facing === 'user') {
          return label.includes('front') || label.includes('facetime') || label.includes('selfie')
        } else {
          return !label.includes('front') && !label.includes('facetime') && !label.includes('selfie')
        }
      })

      const relevantDevices = facingDevices.length > 0 ? facingDevices : videoDevices

      return relevantDevices.map(d => {
        const label = d.label.toLowerCase()
        let type: CameraLens['type'] = 'unknown'

        if (label.includes('ultra') || label.includes('wide angle') || label.includes('0.5')) {
          type = 'ultrawide'
        } else if (label.includes('telephoto') || label.includes('zoom') || label.includes('2x') || label.includes('3x')) {
          type = 'telephoto'
        } else if (label.includes('wide') || label.includes('back') || label.includes('rear') || label.includes('1x')) {
          type = 'wide'
        } else {
          type = 'wide'
        }

        return {
          deviceId: d.deviceId,
          label: d.label || `Camera ${type}`,
          type
        }
      })
    } catch {
      return []
    }
  }

  // Open camera with specific device ID or facing mode
  const openCamera = async (requestedFacingMode: 'environment' | 'user' = facingMode, deviceId?: string) => {
    try {
      setVideoError(null)

      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }

      const lenses = await detectAvailableLenses(requestedFacingMode)
      setAvailableLenses(lenses)

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      }

      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId }
      } else if (lenses.length > 0) {
        const mainLens = lenses.find(l => l.type === 'wide') || lenses[0]
        videoConstraints.deviceId = { exact: mainLens.deviceId }
        setCurrentLensIndex(lenses.indexOf(mainLens))
      } else {
        videoConstraints.facingMode = requestedFacingMode
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      })

      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean }
        setHasFlash(!!capabilities?.torch)
        if (!capabilities?.torch) {
          setFlashMode('off')
        }
      }

      setRecordingStream(stream)
      setFacingMode(requestedFacingMode)
      setCameraOpen(true)
      recordedChunksRef.current = []

    } catch (err) {
      console.error('Failed to open camera:', err)
      setVideoError('Impossible d\'acceder a la camera. Verifiez les permissions.')
      setCameraOpen(false)
    }
  }

  const switchCamera = async () => {
    if (isRecording) return
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setCurrentLensIndex(0)
    await openCamera(newFacingMode)
  }

  const switchLens = async (lensIndex: number) => {
    if (isRecording || lensIndex < 0 || lensIndex >= availableLenses.length) return

    const lens = availableLenses[lensIndex]
    setCurrentLensIndex(lensIndex)
    await openCamera(facingMode, lens.deviceId)
  }

  const toggleFlash = async () => {
    if (!recordingStream || !hasFlash) return

    const videoTrack = recordingStream.getVideoTracks()[0]
    if (!videoTrack) return

    const newFlashMode = flashMode === 'off' ? 'on' : 'off'

    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashMode === 'on' } as MediaTrackConstraintSet]
      })
      setFlashMode(newFlashMode)
    } catch (err) {
      console.error('Failed to toggle flash:', err)
    }
  }

  const getLensLabel = (type: CameraLens['type']): string => {
    switch (type) {
      case 'ultrawide': return '0.5x'
      case 'wide': return '1x'
      case 'telephoto': return '2x'
      default: return '1x'
    }
  }

  const startRecording = () => {
    if (!recordingStream) return

    setIsRecording(true)

    const mediaRecorder = new MediaRecorder(recordingStream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' })
      const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' })
      const preview = URL.createObjectURL(blob)

      setMediaFiles([{ file, preview, type: 'video' }])
      setIsRecording(false)
      setCameraOpen(false)

      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }
      setRecordingStream(null)
    }

    mediaRecorder.start(1000)
  }

  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  const closeCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (recordingStream) {
      recordingStream.getTracks().forEach((track) => track.stop())
    }
    setRecordingStream(null)
    setIsRecording(false)
    setCameraOpen(false)
    recordedChunksRef.current = []
    setFlashMode('off')
    setCurrentLensIndex(0)
  }

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    setUploadProgress(0)
    setUploadError(null)

    const formData = new FormData()

    if (mediaFiles[0]?.type === 'video') {
      formData.append('video', mediaFiles[0].file)
    } else if (isCarousel) {
      mediaFiles.forEach((m) => formData.append('photos', m.file))
    } else if (mediaFiles[0]) {
      formData.append('photo', mediaFiles[0].file)
    }

    if (coverImage) {
      formData.append('cover', coverImage.file)
    }

    formData.append('shareToFeed', shareToFeed ? 'true' : 'false')

    // Include user context if provided
    if (userContext.trim()) {
      formData.append('userContext', userContext.trim())
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
        timeout: 300000,
      })

      if (response.data?.url) {
        router.visit(response.data.url)
      } else if (response.request?.responseURL) {
        router.visit(response.request.responseURL)
      }
    } catch (error: unknown) {
      console.error('Upload error:', error)
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setUploadError('La connexion a expire. Verifiez votre connexion internet.')
        } else if (error.response?.status === 413) {
          setUploadError('Le fichier est trop volumineux.')
        } else {
          setUploadError(error.response?.data?.error || 'Erreur lors de l\'envoi.')
        }
      } else {
        setUploadError('Erreur lors de l\'envoi.')
      }
      setIsUploading(false)
    }
  }, [mediaFiles, coverImage, shareToFeed, mission.id, isCarousel, userContext])

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} Ko`
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  }

  const currentFileSize = mediaFiles[0]?.file?.size || 0

  // Calculate grid columns based on number of ideas
  const getGridCols = () => {
    const count = ideasWithMedia.length
    if (count <= 2) return 'grid-cols-2'
    return 'grid-cols-3'
  }

  return (
    <>
      <Head title={`Mission - Le Phare`} />
      <div className="min-h-screen bg-bg flex flex-col">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 pwa-safe-area-top">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => router.visit('/dashboard')}
              className="p-2.5 -ml-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-text-muted hover:text-text active:scale-[0.97] transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-[13px] font-medium text-text-muted">
              {currentStep}/{totalSteps}
            </span>
          </div>

          <h1 className="text-[24px] font-bold text-text tracking-tight">
            Mission du jour
          </h1>
        </div>

        {/* Content Type Badge + Title + Actions */}
        <div className="px-5 pb-4 animate-fade-up">
          {/* Type badge */}
          <div className="flex items-center gap-2.5 mb-3">
            <span className="bg-text text-white px-3 py-1.5 rounded-xl text-[12px] font-semibold tracking-wide">
              {typeConfig.label}
            </span>
          </div>

          {/* Mission title */}
          <h2 className="text-[17px] font-bold text-text mb-1">
            {mission.template.title}
          </h2>
          <p className="text-[13px] text-text-secondary">
            {typeConfig.description}
          </p>

          {/* Linked tutorial */}
          {mission.template.linkedTutorial && (
            <button
              onClick={() => router.visit(`/tutorials/${mission.template.linkedTutorial!.id}`)}
              className="mt-4 w-full flex items-center gap-3 p-3.5 bg-bg-subtle border border-border rounded-xl hover:bg-bg-card active:scale-[0.98] transition-all"
            >
              <div className="w-9 h-9 bg-text rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-medium text-text">Besoin d'aide ?</p>
                <p className="text-[12px] text-text-muted line-clamp-1">{mission.template.linkedTutorial.title}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-5 pb-44">
          {/* Instagram-style Ideas Grid - inspiration only (no selection) */}
          {ideasWithMedia.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Inspiration</p>
              <div className={`grid ${getGridCols()} gap-1`}>
                {ideasWithMedia.map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => setExpandedIdeaId(idea.id)}
                    className="relative aspect-[9/16] overflow-hidden rounded-xl bg-bg-subtle"
                  >
                    {idea.exampleMediaType === 'video' ? (
                      <LazyVideo
                        src={getIdeaMediaUrl(idea)}
                        className="w-full h-full"
                        autoPlay={true}
                        showPlayIcon={false}
                        onClick={() => setExpandedIdeaId(idea.id)}
                      />
                    ) : (
                      <img
                        src={getIdeaMediaUrl(idea)}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Expanded idea modal */}
              {expandedIdeaId && (
                <div
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setExpandedIdeaId(null)}
                >
                  <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
                    {(() => {
                      const idea = ideasWithMedia.find((i) => i.id === expandedIdeaId)
                      if (!idea) return null
                      return (
                        <>
                          {idea.exampleMediaType === 'video' ? (
                            <video
                              src={getIdeaMediaUrl(idea)}
                              className="w-full aspect-[9/16] object-cover rounded-2xl"
                              autoPlay
                              loop
                              playsInline
                            />
                          ) : (
                            <img
                              src={getIdeaMediaUrl(idea)}
                              alt=""
                              className="w-full aspect-[9/16] object-cover rounded-2xl"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
                            <p className="text-white text-[14px]">{idea.suggestionText}</p>
                            {idea.photoTips && (
                              <p className="text-white/70 text-[12px] mt-1">{idea.photoTips}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedIdeaId(null)}
                            className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </>
                      )
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Text-only ideas (just display, no selection) */}
          {ideasWithMedia.length === 0 && ideas.length > 0 && (
            <div className="mb-6">
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">Inspiration</p>
              <div className="space-y-2">
                {ideas.map((idea) => (
                  <Card key={idea.id} variant="bordered" padding="sm">
                    <p className="text-[13px] text-text">{idea.suggestionText}</p>
                    {idea.photoTips && (
                      <p className="text-[12px] text-text-muted mt-1">{idea.photoTips}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Fallback to template idea if no ideas */}
          {ideas.length === 0 && mission.template.contentIdea && (
            <Card variant="flat" padding="md" className="mb-6">
              <p className="text-[13px] text-text">{mission.template.contentIdea}</p>
            </Card>
          )}

          {/* Media Preview Area */}
          {mediaFiles.length > 0 && (
            <div className="mb-6 flex justify-center">
              <div className={isCarousel ? 'grid grid-cols-2 gap-3 w-full' : 'w-full max-w-xs'}>
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'video' ? (
                      <div
                        className={`relative ${getAspectClass()} bg-black rounded-2xl overflow-hidden cursor-pointer`}
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
                          onError={() => setVideoError('Impossible de lire cette video.')}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm rounded-full p-2">
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`relative ${getAspectClass()} bg-bg-subtle rounded-2xl overflow-hidden`}>
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
                      className="absolute top-2.5 right-2.5 bg-bg-card/90 backdrop-blur-sm rounded-full p-1.5 border border-border border border-border hover:bg-bg-subtle transition-colors"
                    >
                      <X className="w-4 h-4 text-text-secondary" />
                    </button>
                    {isCarousel && (
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-0.5 rounded-lg text-[11px] font-medium">
                        {index + 1}/{mediaFiles.length}
                      </span>
                    )}
                  </div>
                ))}
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
            </div>
          )}

          {/* Reel options */}
          {isReel && mediaFiles.length > 0 && (
            <div className="mt-6 space-y-4">
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
                      onClick={() => setCoverImage(null)}
                      className="absolute -top-1.5 -right-1.5 bg-bg-card rounded-full p-0.5 border border-border border border-border"
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
                <span className="text-[14px] text-text">Partager aussi dans le feed</span>
              </label>
            </div>
          )}

          {/* iOS PWA Recovery Message */}
          {showIOSRecoveryMessage && (
            <Card variant="bordered" padding="md" className="mb-4 border-warning/20 bg-warning-light">
              <p className="text-[13px] text-text text-center">
                <strong>Astuce :</strong> Pour eviter les problemes, filme ta video d'abord avec l'app Camera, puis selectionne-la ici.
              </p>
              <button
                onClick={() => setShowIOSRecoveryMessage(false)}
                className="mt-2 w-full text-[12px] text-warning hover:text-text min-h-[44px] active:scale-[0.97] transition-all"
              >
                Compris
              </button>
            </Card>
          )}

          {/* Error messages as toasts */}
          {flash?.error && <Toast message={flash.error} type="error" />}
          {(videoError || uploadError) && (
            <div className="mt-4 p-3 bg-error-light border border-error/20 rounded-xl">
              <p className="text-error text-[13px] text-center">
                {videoError || uploadError}
              </p>
            </div>
          )}

          {/* Video loading indicator */}
          {videoLoading && (
            <p className="text-[13px] text-text-muted text-center mt-4">
              Chargement de la video...
            </p>
          )}

          {/* File size indicator for videos */}
          {mediaFiles[0]?.type === 'video' && currentFileSize > 0 && !isUploading && (
            <p className="text-[13px] text-text-muted text-center mt-4">
              Taille : {formatFileSize(currentFileSize)}
              {currentFileSize > 50 * 1024 * 1024 && (
                <span className="text-warning ml-1">(fichier volumineux)</span>
              )}
            </p>
          )}

          {/* Context input */}
          {mediaFiles.length > 0 && !isUploading && (
            <div className="mt-6">
              <MediaContextInput
                missionTitle={mission.template.title}
                onContextChange={setUserContext}
                disabled={isUploading}
              />
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
          {/* Unified media input for single upload zone */}
          <input
            ref={mediaInputRef}
            type="file"
            accept={acceptVideo || isStory || isReel ? 'image/*,video/*' : 'image/*'}
            onChange={handleUnifiedMediaChange}
            className="hidden"
          />
        </div>

        {/* Camera Overlay (MediaRecorder API) */}
        {cameraOpen && (
          <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Live video preview */}
            <video
              ref={(el) => {
                liveVideoRef.current = el
                if (el && recordingStream) {
                  el.srcObject = recordingStream
                }
              }}
              className={`flex-1 w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              autoPlay
              playsInline
              muted
            />

            {/* Top controls bar */}
            <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top,12px)] px-4 pb-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center justify-between mt-3">
                <button
                  onClick={closeCamera}
                  className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {hasFlash && facingMode === 'environment' && (
                  <button
                    onClick={toggleFlash}
                    disabled={isRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      flashMode === 'on' ? 'bg-yellow-500' : 'bg-black/40 backdrop-blur-sm'
                    } ${isRecording ? 'opacity-50' : ''}`}
                  >
                    {flashMode === 'on' ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <ZapOff className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}

                {(!hasFlash || facingMode === 'user') && <div className="w-10" />}

                <button
                  onClick={switchCamera}
                  disabled={isRecording}
                  className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center ${
                    isRecording ? 'opacity-50' : ''
                  }`}
                >
                  <SwitchCamera className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-[calc(env(safe-area-inset-top,12px)+60px)] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-error/80 backdrop-blur-sm px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white text-[13px] font-medium">Enregistrement...</span>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,24px)] px-6 pt-6 bg-gradient-to-t from-black/80 to-transparent">
              {/* Lens selector */}
              {availableLenses.length > 1 && facingMode === 'environment' && !isRecording && (
                <div className="flex justify-center gap-2 mb-4">
                  {availableLenses.map((lens, index) => (
                    <button
                      key={lens.deviceId}
                      onClick={() => switchLens(index)}
                      className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                        currentLensIndex === index
                          ? 'bg-white text-black'
                          : 'bg-black/40 backdrop-blur-sm text-white'
                      }`}
                    >
                      {getLensLabel(lens.type)}
                    </button>
                  ))}
                </div>
              )}

              {/* Camera mode indicator */}
              <div className="flex justify-center mb-4">
                <span className="text-white/70 text-[12px]">
                  {facingMode === 'user' ? 'Camera avant' : 'Camera arriere'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6">
                <div className="w-12 h-12" />

                {isRecording ? (
                  <button
                    onClick={stopVideoRecording}
                    className="w-20 h-20 rounded-full bg-error flex items-center justify-center border-4 border-white"
                  >
                    <div className="w-8 h-8 bg-white rounded-sm" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-error flex items-center justify-center border-4 border-white"
                  >
                    <div className="w-14 h-14 bg-error rounded-full" />
                  </button>
                )}

                <div className="w-12 h-12" />
              </div>

              <p className="text-white text-center mt-4 text-[13px]">
                {isRecording ? 'Appuyez sur le carre pour arreter' : 'Appuyez pour commencer a filmer'}
              </p>
            </div>
          </div>
        )}

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-xl border-t border-border space-y-3">
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
                  {uploadProgress < 100 ? 'Ne fermez pas cette page' : 'Traitement en cours...'}
                </p>
              </div>
            </div>
          ) : mediaFiles.length > 0 ? (
            <Button onClick={handleSubmit} fullWidth size="lg">
              Continuer
            </Button>
          ) : (
            /* Single upload zone for all content types */
            <div className="space-y-3">
              <p className="text-[12px] text-text-muted text-center px-2">
                Pour de meilleurs resultats, filmez depuis l'app Camera de votre telephone puis televersez ici
              </p>

              <button
                onClick={() => mediaInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-2 hover:border-text-muted hover:bg-bg-subtle active:scale-[0.98] transition-all"
              >
                <Upload className="w-7 h-7 text-text-muted" />
                <span className="text-[14px] text-text-secondary font-medium">
                  {acceptVideo || isStory || isReel ? 'Ajouter une photo ou video' : 'Ajouter une photo'}
                </span>
                <span className="text-[12px] text-text-muted">
                  Appuyez pour selectionner
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
