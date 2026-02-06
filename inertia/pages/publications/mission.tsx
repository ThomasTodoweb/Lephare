import { Head, router, usePage } from '@inertiajs/react'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Button } from '~/components/ui/Button'
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

const CONTENT_TYPE_CONFIG: Record<string, { label: string; emoji: string; description: string }> = {
  post: { label: 'POST', emoji: '📸', description: 'Photo pour ton feed Instagram' },
  carousel: { label: 'CARROUSEL', emoji: '🖼️', description: 'Plusieurs photos en carrousel' },
  reel: { label: 'REEL', emoji: '🎬', description: 'Vidéo courte et dynamique' },
  story: { label: 'STORY', emoji: '📱', description: 'Contenu éphémère 24h' },
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
  // The "Take Video" option in iOS PWA causes the app to loop/reload (WebKit bug since iOS 12.2)
  // We detect this by saving state before opening file picker and checking on mount
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
      // We were trying to capture a video but the app reloaded (iOS bug)
      const data = JSON.parse(pendingVideoCapture)
      if (data.missionId === mission.id) {
        // Show recovery message
        setShowIOSRecoveryMessage(true)
        // Clear the flag
        sessionStorage.removeItem('pendingVideoCapture')
      }
    }
  }, [mission.id, isIOSPWA])

  // Handle video button click - save state before opening picker on iOS PWA
  const handleVideoClick = () => {
    if (isIOSPWA) {
      // Save state so we can detect if the app reloads due to iOS bug
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
    // iOS may provide 'video/quicktime', 'video/mp4', or even empty type for .MOV files
    const videoExtensions = ['.mp4', '.mov', '.m4v', '.webm', '.avi']
    const hasVideoExtension = videoExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    )
    const hasVideoMimeType = file.type.startsWith('video/') || file.type === ''

    if (!hasVideoMimeType && !hasVideoExtension) {
      setVideoError('Ce fichier n\'est pas une vidéo valide')
      setVideoLoading(false)
      e.target.value = ''
      return
    }

    // Check file size (max 100MB) - only if size is available
    if (file.size > 0 && file.size > 100 * 1024 * 1024) {
      setVideoError('La vidéo est trop volumineuse (max 100 Mo)')
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
      setVideoError('Erreur lors du chargement de la vidéo')
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
        setVideoError('La vidéo est trop volumineuse (max 100 Mo)')
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
        setVideoError('Erreur lors du chargement de la vidéo')
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
          // Back cameras: exclude front-facing ones
          return !label.includes('front') && !label.includes('facetime') && !label.includes('selfie')
        }
      })

      // If no devices match the filter, return all (fallback)
      const relevantDevices = facingDevices.length > 0 ? facingDevices : videoDevices

      // Categorize lenses based on label
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
          // Default to wide for main camera
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

      // Stop existing stream if any
      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }

      // Detect available lenses for this facing mode
      const lenses = await detectAvailableLenses(requestedFacingMode)
      setAvailableLenses(lenses)

      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1080 },
        height: { ideal: 1920 }
      }

      // Use specific device ID if provided, otherwise use facing mode
      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId }
      } else if (lenses.length > 0) {
        // Use the first available lens (usually the main wide camera)
        const mainLens = lenses.find(l => l.type === 'wide') || lenses[0]
        videoConstraints.deviceId = { exact: mainLens.deviceId }
        setCurrentLensIndex(lenses.indexOf(mainLens))
      } else {
        videoConstraints.facingMode = requestedFacingMode
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true,
      })

      // Check flash/torch support
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
      setVideoError('Impossible d\'accéder à la caméra. Vérifiez les permissions.')
      setCameraOpen(false)
    }
  }

  // Switch between front and back camera
  const switchCamera = async () => {
    if (isRecording) return // Don't switch while recording
    const newFacingMode = facingMode === 'environment' ? 'user' : 'environment'
    setCurrentLensIndex(0) // Reset to first lens when switching
    await openCamera(newFacingMode)
  }

  // Switch to a specific lens (physical camera)
  const switchLens = async (lensIndex: number) => {
    if (isRecording || lensIndex < 0 || lensIndex >= availableLenses.length) return

    const lens = availableLenses[lensIndex]
    setCurrentLensIndex(lensIndex)
    await openCamera(facingMode, lens.deviceId)
  }

  // Toggle flash/torch
  const toggleFlash = async () => {
    if (!recordingStream || !hasFlash) return

    const videoTrack = recordingStream.getVideoTracks()[0]
    if (!videoTrack) return

    const newFlashMode = flashMode === 'off' ? 'on' : 'off'

    try {
      // Apply torch constraint
      await videoTrack.applyConstraints({
        advanced: [{ torch: newFlashMode === 'on' } as MediaTrackConstraintSet]
      })
      setFlashMode(newFlashMode)
    } catch (err) {
      console.error('Failed to toggle flash:', err)
    }
  }

  // Get display label for lens type
  const getLensLabel = (type: CameraLens['type']): string => {
    switch (type) {
      case 'ultrawide': return '0.5x'
      case 'wide': return '1x'
      case 'telephoto': return '2x'
      default: return '1x'
    }
  }

  // Start recording (step 2 - after camera is open)
  const startRecording = () => {
    if (!recordingStream) return

    setIsRecording(true)

    // Create MediaRecorder - don't specify mimeType for iOS compatibility
    const mediaRecorder = new MediaRecorder(recordingStream)
    mediaRecorderRef.current = mediaRecorder

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = () => {
      // Create video file from recorded chunks
      const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' })
      const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' })
      const preview = URL.createObjectURL(blob)

      setMediaFiles([{ file, preview, type: 'video' }])
      setIsRecording(false)
      setCameraOpen(false)

      // Clean up stream
      if (recordingStream) {
        recordingStream.getTracks().forEach((track) => track.stop())
      }
      setRecordingStream(null)
    }

    // Start recording with 1 second timeslices
    mediaRecorder.start(1000)
  }

  // Stop video recording
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }

  // Cancel and close camera
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
    // Reset camera controls
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
          setUploadError('La connexion a expiré. Vérifiez votre connexion internet.')
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 pwa-safe-area-top">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.visit('/dashboard')}
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

        {/* Content Type Badge + Title + Actions */}
        <div className="px-6 pb-4">
          {/* Type badge with emoji */}
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-neutral-900 text-white px-4 py-2 rounded-xl flex items-center gap-2">
              <span className="text-xl">{typeConfig.emoji}</span>
              <span className="text-sm font-bold font-display tracking-wide">
                {typeConfig.label}
              </span>
            </div>
          </div>

          {/* Mission title */}
          <h2 className="text-lg font-bold text-neutral-900 mb-1">
            {mission.template.title}
          </h2>
          <p className="text-sm text-neutral-500">
            {typeConfig.description}
          </p>

          {/* Linked tutorial - "Besoin d'aide?" section */}
          {mission.template.linkedTutorial && (
            <button
              onClick={() => router.visit(`/tutorials/${mission.template.linkedTutorial!.id}`)}
              className="mt-4 w-full flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors"
            >
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-amber-900">Besoin d'aide ?</p>
                <p className="text-xs text-amber-700 line-clamp-1">{mission.template.linkedTutorial.title}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-500 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1 px-6 pb-40">
          {/* Instagram-style Ideas Grid - inspiration only (no selection) */}
          {ideasWithMedia.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-neutral-700 mb-3">Inspiration :</p>
              <div className={`grid ${getGridCols()} gap-1`}>
                {ideasWithMedia.map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => setExpandedIdeaId(idea.id)}
                    className="relative aspect-[9/16] overflow-hidden rounded-lg bg-neutral-100"
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
                          // Hide broken images
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
                  className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
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
                              className="w-full aspect-[9/16] object-cover rounded-xl"
                              autoPlay
                              loop
                              playsInline
                              // Sound enabled when expanded
                            />
                          ) : (
                            <img
                              src={getIdeaMediaUrl(idea)}
                              alt=""
                              className="w-full aspect-[9/16] object-cover rounded-xl"
                            />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent rounded-b-xl">
                            <p className="text-white text-sm">{idea.suggestionText}</p>
                            {idea.photoTips && (
                              <p className="text-white/70 text-xs mt-1">💡 {idea.photoTips}</p>
                            )}
                          </div>
                          <button
                            onClick={() => setExpandedIdeaId(null)}
                            className="absolute top-2 right-2 bg-black/50 rounded-full p-2"
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
              <p className="text-sm font-medium text-neutral-700 mb-3">Inspiration :</p>
              <div className="space-y-2">
                {ideas.map((idea) => (
                  <div
                    key={idea.id}
                    className="w-full text-left p-3 rounded-lg border border-neutral-200 bg-white"
                  >
                    <p className="text-sm text-neutral-800">{idea.suggestionText}</p>
                    {idea.photoTips && (
                      <p className="text-xs text-neutral-500 mt-1">💡 {idea.photoTips}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback to template idea if no ideas */}
          {ideas.length === 0 && mission.template.contentIdea && (
            <div className="mb-6 p-4 bg-amber-50 rounded-xl">
              <p className="text-sm text-neutral-800">{mission.template.contentIdea}</p>
            </div>
          )}

          {/* Media Preview Area */}
          {mediaFiles.length > 0 && (
            <div className="mb-6 flex justify-center">
              <div className={isCarousel ? 'grid grid-cols-2 gap-3 w-full' : 'w-full max-w-xs'}>
                {mediaFiles.map((media, index) => (
                  <div key={index} className="relative">
                    {media.type === 'video' ? (
                      <div
                        className={`relative ${getAspectClass()} bg-black rounded-xl overflow-hidden cursor-pointer`}
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
                          onError={() => setVideoError('Impossible de lire cette vidéo.')}
                        />
                        <div className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2">
                          {isMuted ? (
                            <VolumeX className="w-4 h-4 text-white" />
                          ) : (
                            <Volume2 className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className={`relative ${getAspectClass()} bg-neutral-100 rounded-xl overflow-hidden`}>
                        <img
                          src={media.preview}
                          alt={`Aperçu ${index + 1}`}
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
                    className="aspect-[4/5] bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-neutral-300 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-neutral-400 mb-1" />
                    <span className="text-xs text-neutral-500">Ajouter</span>
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
                      onClick={() => setCoverImage(null)}
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

          {/* iOS PWA Recovery Message - shown if app reloaded due to video capture bug */}
          {showIOSRecoveryMessage && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800 text-center">
                <strong>Astuce :</strong> Pour éviter les problèmes, filme ta vidéo d'abord avec l'app Caméra, puis sélectionne-la ici depuis "Photothèque".
              </p>
              <button
                onClick={() => setShowIOSRecoveryMessage(false)}
                className="mt-2 w-full text-xs text-amber-600 underline"
              >
                Compris
              </button>
            </div>
          )}

          {/* Error messages as toasts */}
          {flash?.error && <Toast message={flash.error} type="error" />}
          {(videoError || uploadError) && (
            <p className="text-red-600 text-sm mt-4 text-center">
              {videoError || uploadError}
            </p>
          )}

          {/* Video loading indicator */}
          {videoLoading && (
            <p className="text-sm text-neutral-500 text-center mt-4">
              Chargement de la vidéo...
            </p>
          )}

          {/* File size indicator for videos */}
          {mediaFiles[0]?.type === 'video' && currentFileSize > 0 && !isUploading && (
            <p className="text-sm text-neutral-500 text-center mt-4">
              Taille : {formatFileSize(currentFileSize)}
              {currentFileSize > 50 * 1024 * 1024 && (
                <span className="text-amber-600 ml-1">(fichier volumineux)</span>
              )}
            </p>
          )}

          {/* Context input - ask user for additional info based on mission type */}
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
          {/*
            Video input WITHOUT capture attribute
            On iOS, this shows a native menu with options:
            - "Photo Library" (select existing video)
            - "Take Video" (record new video with native camera)

            This works better than capture="environment" which breaks
            the PWA lifecycle on iOS (WebKit bug since iOS 12.2)
            See: https://github.com/PWA-POLICE/pwa-bugs/issues/12
          */}
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
            {/* Live video preview - use ref callback to set srcObject */}
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

            {/* Top controls bar - with safe area padding for notch/dynamic island */}
            <div className="absolute top-0 left-0 right-0 pt-[env(safe-area-inset-top,12px)] px-4 pb-4 bg-gradient-to-b from-black/60 to-transparent">
              <div className="flex items-center justify-between mt-3">
                {/* Close button */}
                <button
                  onClick={closeCamera}
                  className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center"
                >
                  <X className="w-5 h-5 text-white" />
                </button>

                {/* Flash toggle (only show if device has flash and using back camera) */}
                {hasFlash && facingMode === 'environment' && (
                  <button
                    onClick={toggleFlash}
                    disabled={isRecording}
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      flashMode === 'on' ? 'bg-yellow-500' : 'bg-black/40'
                    } ${isRecording ? 'opacity-50' : ''}`}
                  >
                    {flashMode === 'on' ? (
                      <Zap className="w-5 h-5 text-white" />
                    ) : (
                      <ZapOff className="w-5 h-5 text-white" />
                    )}
                  </button>
                )}

                {/* Spacer if no flash */}
                {(!hasFlash || facingMode === 'user') && <div className="w-10" />}

                {/* Switch camera button (front/back) */}
                <button
                  onClick={switchCamera}
                  disabled={isRecording}
                  className={`w-10 h-10 rounded-full bg-black/40 flex items-center justify-center ${
                    isRecording ? 'opacity-50' : ''
                  }`}
                >
                  <SwitchCamera className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-[calc(env(safe-area-inset-top,12px)+60px)] left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-500/80 px-4 py-2 rounded-full">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                <span className="text-white text-sm font-medium">Enregistrement...</span>
              </div>
            )}

            {/* Bottom controls - with safe area padding */}
            <div className="absolute bottom-0 left-0 right-0 pb-[env(safe-area-inset-bottom,24px)] px-6 pt-6 bg-gradient-to-t from-black/80 to-transparent">
              {/* Lens selector (physical cameras) - only show if multiple lenses available and back camera */}
              {availableLenses.length > 1 && facingMode === 'environment' && !isRecording && (
                <div className="flex justify-center gap-2 mb-4">
                  {availableLenses.map((lens, index) => (
                    <button
                      key={lens.deviceId}
                      onClick={() => switchLens(index)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        currentLensIndex === index
                          ? 'bg-white text-black'
                          : 'bg-black/40 text-white'
                      }`}
                    >
                      {getLensLabel(lens.type)}
                    </button>
                  ))}
                </div>
              )}

              {/* Camera mode indicator */}
              <div className="flex justify-center mb-4">
                <span className="text-white/70 text-xs">
                  {facingMode === 'user' ? 'Caméra avant' : 'Caméra arrière'}
                </span>
              </div>

              <div className="flex items-center justify-center gap-6">
                {/* Placeholder for symmetry */}
                <div className="w-12 h-12" />

                {/* Record/Stop button */}
                {isRecording ? (
                  <button
                    onClick={stopVideoRecording}
                    className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center border-4 border-white"
                  >
                    <div className="w-8 h-8 bg-white rounded-sm" />
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center border-4 border-white"
                  >
                    <div className="w-14 h-14 bg-red-500 rounded-full" />
                  </button>
                )}

                {/* Placeholder for symmetry */}
                <div className="w-12 h-12" />
              </div>

              <p className="text-white text-center mt-4 text-sm">
                {isRecording ? 'Appuyez sur le carré pour arrêter' : 'Appuyez pour commencer à filmer'}
              </p>
            </div>
          </div>
        )}

        {/* Fixed bottom buttons */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background border-t border-neutral-100 space-y-3">
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
            <Button onClick={handleSubmit} className="w-full py-4 text-base font-bold">
              Continuer →
            </Button>
          ) : (
            /* Single upload zone for all content types */
            <div className="space-y-3">
              {/* Tip message */}
              <p className="text-xs text-neutral-500 text-center px-2">
                💡 Pour de meilleurs résultats, filmez depuis l'app Caméra de votre téléphone puis téléversez ici
              </p>

              {/* Unified upload zone */}
              <button
                onClick={() => mediaInputRef.current?.click()}
                className="w-full border-2 border-dashed border-neutral-300 rounded-xl p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <Upload className="w-8 h-8 text-neutral-400" />
                <span className="text-sm text-neutral-600 font-medium">
                  {acceptVideo || isStory || isReel ? 'Ajouter une photo ou vidéo' : 'Ajouter une photo'}
                </span>
                <span className="text-xs text-neutral-400">
                  Appuyez pour sélectionner
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
