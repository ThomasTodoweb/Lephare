import { useState, useEffect, useRef } from 'react'
import { Check, Camera, Smartphone, Film, BookOpen, MessageCircle, Images, Loader2, ChevronRight } from 'lucide-react'

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

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string }> = {
  post: { icon: <Camera className="w-3.5 h-3.5" />, label: 'Post' },
  story: { icon: <Smartphone className="w-3.5 h-3.5" />, label: 'Story' },
  reel: { icon: <Film className="w-3.5 h-3.5" />, label: 'Reel' },
  tuto: { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Tuto' },
  engagement: { icon: <MessageCircle className="w-3.5 h-3.5" />, label: 'Engagement' },
  carousel: { icon: <Images className="w-3.5 h-3.5" />, label: 'Carrousel' },
}

export function MissionCard({ mission, onStart, isActive = true }: MissionCardProps) {
  const isCompleted = mission.status === 'completed'
  const isSkipped = mission.status === 'skipped'
  const typeConfig = TYPE_CONFIG[mission.type || 'post'] || TYPE_CONFIG.post

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
    }, 3000)
    return () => clearInterval(interval)
  }, [hasCarousel, carouselImages.length, isActive])

  useEffect(() => {
    if (!isVideo || !videoRef.current) return
    if (isActive) { videoRef.current.play().catch(() => {}) }
    else { videoRef.current.pause() }
  }, [isVideo, isActive])

  useEffect(() => {
    if (isVideo) { setVideoLoaded(false); setVideoError(false) }
  }, [mission.coverImageUrl, isVideo])

  return (
    <div
      onClick={onStart}
      className={`
        relative overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-200 w-full
        ${isCompleted ? 'opacity-60' : ''}
      `}
      style={{ aspectRatio: '3/4' }}
    >
      {/* Background Media */}
      {isVideo ? (
        <>
          {!videoLoaded && !videoError && (
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
            </div>
          )}
          {videoError && (
            <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
              <Film className="w-10 h-10 text-white/20" />
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
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
        </div>
      ) : (
        <img
          src={mission.coverImageUrl}
          alt={mission.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

      {/* Top: Type badge */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
        <div className="glass px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-text">
          {typeConfig.icon}
          <span className="text-[11px] font-semibold">{typeConfig.label}</span>
        </div>

        {isCompleted && (
          <div className="bg-green-500 text-white px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span className="text-[11px] font-semibold">Fait</span>
          </div>
        )}
        {isSkipped && (
          <div className="bg-neutral-500 text-white px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-semibold">Passé</span>
          </div>
        )}
      </div>

      {/* Bottom: Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h2 className="text-white font-bold text-lg leading-snug mb-1">
          {mission.title}
        </h2>
        <p className="text-white/70 text-[13px] line-clamp-2 mb-3">
          {mission.description}
        </p>

        {!isCompleted && !isSkipped && (
          <div className="flex items-center justify-between bg-white text-text rounded-xl px-4 py-3 font-semibold text-[14px]">
            <span>C'est parti</span>
            <ChevronRight size={16} />
          </div>
        )}
      </div>
    </div>
  )
}
