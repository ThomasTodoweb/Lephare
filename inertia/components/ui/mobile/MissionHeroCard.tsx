import { useState, useRef, useEffect } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { MissionTypeIcon, type MissionType } from './MissionTypeIcon'

export interface MissionHeroCardProps {
  title: string
  description: string
  imageUrl: string
  type?: MissionType
  completed?: boolean
  onStart?: () => void
  className?: string
}

export function MissionHeroCard({
  title,
  description,
  imageUrl,
  type = 'post',
  completed = false,
  onStart,
  className = '',
}: MissionHeroCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 60)
    return () => clearTimeout(timer)
  }, [])

  const TYPE_LABELS: Record<MissionType, string> = {
    post: 'Post',
    story: 'Story',
    reel: 'Reel',
    tuto: 'Tuto',
    engagement: 'Engagement',
  }

  return (
    <div
      ref={cardRef}
      onClick={!completed ? onStart : undefined}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onTouchCancel={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative w-full overflow-hidden rounded-2xl cursor-pointer
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}
        ${isPressed && !completed ? 'scale-[0.98]' : 'scale-100'}
        ${className}
      `}
      style={{ aspectRatio: '4/5' }}
    >
      {/* Background image */}
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover"
        loading="eager"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {/* Completed overlay */}
      {completed && (
        <div className="absolute inset-0 bg-green-600/60 flex items-center justify-center z-10">
          <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Check className="w-8 h-8 text-white" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Type badge */}
      <div className="absolute top-3 left-3 z-20">
        <div className="glass px-2.5 py-1 rounded-full flex items-center gap-1.5">
          <MissionTypeIcon type={type} size={14} className="text-text" />
          <span className="text-[11px] font-semibold text-text">
            {TYPE_LABELS[type]}
          </span>
        </div>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <h2 className="text-white font-bold text-[20px] leading-tight mb-1">
          {title}
        </h2>
        <p className="text-white/70 text-[13px] leading-snug line-clamp-1 mb-4">
          {description}
        </p>

        {!completed && (
          <button
            className="
              w-full flex items-center justify-between
              bg-white text-text rounded-xl px-4 py-3.5
              font-semibold text-[15px]
              active:scale-[0.98] transition-transform duration-150
            "
          >
            <span>C'est parti</span>
            <ChevronRight size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </div>
  )
}

/*
 * Usage:
 *
 * <MissionHeroCard
 *   title="Photographie ton plat du jour"
 *   description="Montre la star de ta carte avec une belle lumiere naturelle"
 *   imageUrl="/images/missions/plat-du-jour.jpg"
 *   type="post"
 *   onStart={() => router.visit('/missions/1/start')}
 * />
 *
 * // Completed state:
 * <MissionHeroCard
 *   title="Photographie ton plat du jour"
 *   description="Montre la star de ta carte"
 *   imageUrl="/images/missions/plat-du-jour.jpg"
 *   type="post"
 *   completed
 * />
 */
