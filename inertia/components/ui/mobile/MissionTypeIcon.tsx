import { Camera, Circle, Film, BookOpen, Heart } from 'lucide-react'
import { type ReactNode } from 'react'

export type MissionType = 'post' | 'story' | 'reel' | 'tuto' | 'engagement'

export interface MissionTypeIconProps {
  type: MissionType
  size?: number
  color?: string
  /** Wrap in a colored circle background */
  withBackground?: boolean
  className?: string
}

const ICON_MAP: Record<MissionType, (props: { size: number; className?: string }) => ReactNode> = {
  post: ({ size, className }) => <Camera size={size} className={className} />,
  story: ({ size, className }) => <Circle size={size} fill="currentColor" className={className} />,
  reel: ({ size, className }) => <Film size={size} className={className} />,
  tuto: ({ size, className }) => <BookOpen size={size} className={className} />,
  engagement: ({ size, className }) => <Heart size={size} className={className} />,
}

const BG_COLORS: Record<MissionType, string> = {
  post: 'bg-blue-50 text-blue-600',
  story: 'bg-purple-50 text-purple-600',
  reel: 'bg-pink-50 text-pink-600',
  tuto: 'bg-amber-50 text-amber-600',
  engagement: 'bg-rose-50 text-rose-600',
}

export function MissionTypeIcon({
  type,
  size = 20,
  color,
  withBackground = false,
  className = '',
}: MissionTypeIconProps) {
  const IconComponent = ICON_MAP[type]
  const colorClass = color ? '' : className
  const style = color ? { color } : undefined

  if (withBackground) {
    const bgSize = size * 2
    return (
      <div
        className={`rounded-full flex items-center justify-center ${BG_COLORS[type]}`}
        style={{ width: bgSize, height: bgSize }}
      >
        <div style={style}>
          {IconComponent({ size, className: colorClass })}
        </div>
      </div>
    )
  }

  return (
    <span style={style} className={`inline-flex ${className}`}>
      {IconComponent({ size, className: '' })}
    </span>
  )
}

/*
 * Usage:
 *
 * // Standalone icon
 * <MissionTypeIcon type="post" size={20} />
 * <MissionTypeIcon type="reel" size={16} color="#dd2c0c" />
 *
 * // With colored circle background
 * <MissionTypeIcon type="story" size={20} withBackground />
 * <MissionTypeIcon type="engagement" size={16} withBackground />
 *
 * // In a list
 * {missions.map(m => (
 *   <MissionTypeIcon key={m.id} type={m.type} size={16} withBackground />
 * ))}
 */
