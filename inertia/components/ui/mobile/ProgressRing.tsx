import { useEffect, useState } from 'react'

export interface ProgressRingProps {
  /** Progress from 0 to 100 */
  progress: number
  /** Display size */
  size?: 40 | 56 | 72
  /** Stroke color (tailwind class or hex) */
  color?: string
  /** Track color */
  trackColor?: string
  /** Value to show at center */
  label?: string | number
  /** Label font size override */
  labelSize?: number
  className?: string
}

const STROKE_WIDTHS: Record<number, number> = {
  40: 3,
  56: 3.5,
  72: 4,
}

const LABEL_SIZES: Record<number, number> = {
  40: 11,
  56: 14,
  72: 18,
}

export function ProgressRing({
  progress,
  size = 56,
  color = 'var(--color-primary)',
  trackColor = 'var(--color-bg-subtle)',
  label,
  labelSize,
  className = '',
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  const strokeWidth = STROKE_WIDTHS[size]
  const radius = (size - strokeWidth * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedProgress / 100) * circumference
  const center = size / 2
  const fontSize = labelSize ?? LABEL_SIZES[size]

  useEffect(() => {
    // Animate on mount and when progress changes
    const timer = requestAnimationFrame(() => {
      setAnimatedProgress(Math.min(100, Math.max(0, progress)))
    })
    return () => cancelAnimationFrame(timer)
  }, [progress])

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      </svg>

      {/* Center label */}
      {label !== undefined && (
        <span
          className="absolute font-bold text-text tabular-nums"
          style={{ fontSize }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

/*
 * Usage:
 *
 * <ProgressRing progress={75} size={56} label="75" />
 *
 * <ProgressRing
 *   progress={40}
 *   size={72}
 *   color="var(--color-xp)"
 *   label="2/5"
 * />
 *
 * <ProgressRing progress={100} size={40} label="✓" labelSize={14} />
 */
