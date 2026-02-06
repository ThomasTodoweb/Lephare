import { useState, useEffect, useRef } from 'react'
import { Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images, Loader2 } from 'lucide-react'
import { Heading } from '~/components/ui'

export interface MissionCardProps {
  mission: {
    id: number
    title: string
    description: string
    coverImageUrl: string
    mediaType?: 'image' | 'video'
    carouselImages?: string[]
    type?: 'post' | 'story' | 'reel' | 'tuto' | 'engagement' | 'carousel'
    status?: 'pending' | 'completed' | 'skipped'
    isRecommended?: boolean
  }
  onStart: () => void
  isActive?: boolean
}

// Map mission type to icon and label
const missionTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-5 h-5" />, label: 'Post' },
  story: { icon: <Smartphone className="w-5 h-5" />, label: 'Story' },
  reel: { icon: <Film className="w-5 h-5" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-5 h-5" />, label: 'Tutoriel' },
  engagement: { icon: <MessageCircle className="w-5 h-5" />, label: 'Engagement' },
  carousel: { icon: <Images className="w-5 h-5" />, label: 'Carrousel' },
}

export function MissionCard({ mission, onStart, isActive = true }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isSkipped = mission.status === 'skipped'
  const typeConfig = missionTypeConfig[mission.type || 'post'] || missionTypeConfig.post

  // For carousel: track current image index
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const carouselImages = mission.carouselImages || []
  const hasCarousel = carouselImages.length > 1

  // Video ref for autoplay control
  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = mission.mediaType === 'video'

  // Video loading state
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // Carousel auto-advance every 2 seconds
  useEffect(() => {
    if (!hasCarousel || !isActive) return

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [hasCarousel, carouselImages.length, isActive])

  // Video autoplay when active
  useEffect(() => {
    if (!isVideo || !videoRef.current) return

    if (isActive) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's OK
      })
    } else {
      videoRef.current.pause()
    }
  }, [isVideo, isActive])

  // Reset video state when URL changes
  useEffect(() => {
    if (isVideo) {
      setVideoLoaded(false)
      setVideoError(false)
    }
  }, [mission.coverImageUrl, isVideo])

  return (
    <div
      onClick={onStart}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        ring-2 ring-neutral-200
        scale-100 opacity-100
        w-full min-h-[72vh]
      `}
    >
      {/* Background Media */}
      {isVideo ? (
        // Video background with autoplay and loading placeholder
        <>
          {/* Loading placeholder - shown while video loads */}
          {!videoLoaded && !videoError && (
            <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}
          {/* Error placeholder - shown if video fails to load */}
          {videoError && (
            <div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center">
              <Film className="w-12 h-12 text-white/30" />
            </div>
          )}
          {/* Video element */}
          <video
            ref={videoRef}
            src={mission.coverImageUrl}
            autoPlay
            muted
            loop
            playsInline
            preload={isActive ? "auto" : "metadata"}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : hasCarousel ? (
        // Carousel background with sliding images
        <div className="absolute inset-0 w-full h-full">
          {carouselImages.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={`${mission.title} ${index + 1}`}
              className={`
                absolute inset-0 w-full h-full object-cover
                transition-opacity duration-500 ease-in-out
                ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}
              `}
            />
          ))}
          {/* Carousel indicators */}
          <div className="absolute bottom-20 left-0 right-0 flex justify-center gap-1.5 z-10">
            {carouselImages.map((_, index) => (
              <div
                key={index}
                className={`
                  w-1.5 h-1.5 rounded-full transition-all duration-300
                  ${index === currentImageIndex ? 'bg-white w-4' : 'bg-white/50'}
                `}
              />
            ))}
          </div>
        </div>
      ) : (
        // Single image background
        <img
          src={mission.coverImageUrl}
          alt={mission.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Overlay gradient */}
      <div className={`absolute inset-0 ${isCompleted ? 'bg-black/50' : 'bg-gradient-to-t from-black/90 via-black/40 to-black/20'}`} />

      {/* Statut en haut */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        {/* Type de contenu */}
        <div className="bg-white/95 backdrop-blur-sm text-neutral-900 px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
          {typeConfig.icon}
          <span className="font-semibold text-sm">{typeConfig.label}</span>
        </div>

        {/* Indicateur de statut */}
        {isCompleted ? (
          <div className="bg-green-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <Check className="w-4 h-4" />
            <span className="font-semibold text-sm">Fait !</span>
          </div>
        ) : isSkipped ? (
          <div className="bg-neutral-500 text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="font-semibold text-sm">Passe</span>
          </div>
        ) : (
          <div className="bg-primary text-white px-3 py-2 rounded-xl flex items-center gap-2 shadow-lg">
            <span className="font-semibold text-sm">A faire</span>
          </div>
        )}
      </div>

      {/* Contenu en bas */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <Heading level={2} className="text-white mb-2 text-xl font-bold drop-shadow-lg">
          {mission.title}
        </Heading>
        <p className="text-white/90 text-sm mb-4 line-clamp-2 drop-shadow-md">
          {mission.description}
        </p>
        <div
          className={`
            inline-block rounded-lg px-4 py-2 text-sm font-medium transition-all
            ${isCompleted
              ? 'bg-green-500/80 text-white'
              : 'bg-white/20 backdrop-blur-sm text-white border border-white/30'
            }
          `}
        >
          {isCompleted ? 'Voir les détails' : "C'est parti !"}
        </div>
      </div>
    </div>
  )
}
