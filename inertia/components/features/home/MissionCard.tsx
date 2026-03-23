import { useState, useEffect, useRef } from 'react'
import { Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images, Loader2, ArrowRight } from 'lucide-react'

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

const missionTypeConfig: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-4 h-4" />, label: 'Post' },
  story: { icon: <Smartphone className="w-4 h-4" />, label: 'Story' },
  reel: { icon: <Film className="w-4 h-4" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-4 h-4" />, label: 'Tutoriel' },
  engagement: { icon: <MessageCircle className="w-4 h-4" />, label: 'Engagement' },
  carousel: { icon: <Images className="w-4 h-4" />, label: 'Carrousel' },
}

export function MissionCard({ mission, onStart, isActive = true }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isSkipped = mission.status === 'skipped'
  const typeConfig = missionTypeConfig[mission.type || 'post'] || missionTypeConfig.post

  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const carouselImages = mission.carouselImages || []
  const hasCarousel = carouselImages.length > 1

  const videoRef = useRef<HTMLVideoElement>(null)
  const isVideo = mission.mediaType === 'video'
  const [videoLoaded, setVideoLoaded] = useState(false)
  const [videoError, setVideoError] = useState(false)

  useEffect(() => {
    if (!hasCarousel || !isActive) return
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % carouselImages.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [hasCarousel, carouselImages.length, isActive])

  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    if (isActive) {
      videoRef.current.play().catch(() => {})
    } else {
      videoRef.current.pause()
    }
  }, [isVideo, isActive])

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
        relative overflow-hidden rounded-[var(--radius-xl)] cursor-pointer
        transition-all duration-[var(--duration-normal)]
        w-full min-h-[65vh]
        ${isCompleted ? 'opacity-75' : 'shadow-md hover:shadow-lg'}
      `}
    >
      {/* Background Media */}
      {isVideo ? (
        <>
          {!videoLoaded && !videoError && (
            <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
            </div>
          )}
          {videoError && (
            <div className="absolute inset-0 bg-neutral-800 flex items-center justify-center">
              <Film className="w-12 h-12 text-white/30" />
            </div>
          )}
          <video
            ref={videoRef}
            src={mission.coverImageUrl}
            autoPlay muted loop playsInline
            preload={isActive ? "auto" : "metadata"}
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        </>
      ) : hasCarousel ? (
        <div className="absolute inset-0">
          {carouselImages.map((img, index) => (
            <img
              key={img}
              src={img}
              alt={`${mission.title} ${index + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          <div className="absolute bottom-24 left-0 right-0 flex justify-center gap-1.5 z-10">
            {carouselImages.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex ? 'bg-white w-5' : 'bg-white/40 w-1.5'}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <img
          src={mission.coverImageUrl}
          alt={mission.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient overlay */}
      <div className={`absolute inset-0 ${isCompleted ? 'bg-black/50' : 'bg-gradient-to-t from-black/80 via-black/20 to-transparent'}`} />

      {/* Top badges */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
        <div className="bg-white/95 backdrop-blur-sm text-text px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
          {typeConfig.icon}
          <span className="font-semibold text-xs">{typeConfig.label}</span>
        </div>

        {isCompleted ? (
          <div className="bg-success text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <Check className="w-3.5 h-3.5" />
            <span className="font-semibold text-xs">Fait</span>
          </div>
        ) : isSkipped ? (
          <div className="bg-neutral-500 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="font-semibold text-xs">Pass\u00e9</span>
          </div>
        ) : mission.isRecommended ? (
          <div className="bg-primary text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
            <span className="font-semibold text-xs">Objectif du jour</span>
          </div>
        ) : null}
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        <h2 className="text-white font-bold text-xl mb-1.5 drop-shadow-lg leading-tight">
          {mission.title}
        </h2>
        <p className="text-white/80 text-sm mb-5 line-clamp-2">
          {mission.description}
        </p>

        {!isCompleted && (
          <button className="w-full bg-white text-text font-semibold py-3.5 rounded-[var(--radius-sm)] flex items-center justify-center gap-2 shadow-md active:scale-[0.97] transition-transform">
            C'est parti !
            <ArrowRight size={18} />
          </button>
        )}
        {isCompleted && (
          <button className="w-full bg-white/20 backdrop-blur-sm text-white font-medium py-3 rounded-[var(--radius-sm)] border border-white/30">
            Voir les d\u00e9tails
          </button>
        )}
      </div>
    </div>
  )
}
