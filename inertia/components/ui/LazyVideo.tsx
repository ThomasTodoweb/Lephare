import { useState, useRef, useEffect } from 'react'
import { Play } from 'lucide-react'

interface LazyVideoProps {
  src: string
  className?: string
  autoPlay?: boolean
  showPlayIcon?: boolean
  muted?: boolean
  loop?: boolean
  playsInline?: boolean
  onClick?: () => void
}

/**
 * LazyVideo - Optimized video component
 *
 * - Loads only when visible in viewport (Intersection Observer)
 * - Uses preload="none" until visible, then loads and plays
 * - Falls back gracefully if video fails to load
 */
export function LazyVideo({
  src,
  className = '',
  autoPlay = true,
  showPlayIcon = true,
  muted = true,
  loop = true,
  playsInline = true,
  onClick,
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [hasStartedLoading, setHasStartedLoading] = useState(false)

  // Intersection Observer - only load video when visible
  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (!hasStartedLoading) {
              setHasStartedLoading(true)
            }
          } else {
            setIsVisible(false)
            // Pause when out of view to save resources
            if (videoRef.current && isPlaying) {
              videoRef.current.pause()
              setIsPlaying(false)
            }
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [hasStartedLoading, isPlaying])

  // Start playing when visible and loaded
  useEffect(() => {
    if (isVisible && hasStartedLoading && videoRef.current && autoPlay) {
      videoRef.current.play().catch(() => {
        // Autoplay might be blocked, that's OK
      })
    }
  }, [isVisible, hasStartedLoading, autoPlay])

  const handleLoadedData = () => {
    if (isVisible && autoPlay && videoRef.current) {
      videoRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }

  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play().catch(() => {})
      }
    }
  }

  const handleMouseEnter = () => {
    if (videoRef.current && hasStartedLoading && !onClick && !isPlaying) {
      videoRef.current.play().catch(() => {})
    }
  }

  const handleMouseLeave = () => {
    if (videoRef.current && !onClick && !autoPlay) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }

  if (hasError) {
    return (
      <div className={`bg-neutral-200 flex items-center justify-center ${className}`}>
        <span className="text-neutral-400 text-xs">Vidéo indisponible</span>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasStartedLoading ? (
        <video
          ref={videoRef}
          src={src}
          className="w-full h-full object-cover"
          muted={muted}
          loop={loop}
          playsInline={playsInline}
          preload="metadata"
          onLoadedData={handleLoadedData}
          onPlay={handlePlay}
          onPause={handlePause}
          onError={() => setHasError(true)}
        />
      ) : (
        // Placeholder while not visible
        <div className="w-full h-full bg-neutral-100" />
      )}

      {/* Play icon overlay - shown when not playing */}
      {showPlayIcon && !isPlaying && hasStartedLoading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
          <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white ml-0.5" />
          </div>
        </div>
      )}
    </div>
  )
}
