import { type ReactNode } from 'react'

export interface InsightCardProps {
  icon?: string
  message: string
  type?: 'tip' | 'stat' | 'alert'
  ctaLabel?: string
  onCtaClick?: () => void
  className?: string
}

const TYPE_CONFIG = {
  tip: {
    icon: '💡',
    bg: 'bg-amber-50/60',
    border: 'border-amber-100',
  },
  stat: {
    icon: '📈',
    bg: 'bg-blue-50/60',
    border: 'border-blue-100',
  },
  alert: {
    icon: '⚡',
    bg: 'bg-purple-50/60',
    border: 'border-purple-100',
  },
} as const

export function InsightCard({
  icon,
  message,
  type = 'tip',
  ctaLabel,
  onCtaClick,
  className = '',
}: InsightCardProps) {
  const config = TYPE_CONFIG[type]
  const displayIcon = icon ?? config.icon

  return (
    <div
      className={`
        ${config.bg} border ${config.border}
        rounded-2xl px-4 py-3.5
        flex items-center gap-3
        ${className}
      `}
    >
      {/* Icon */}
      <span className="text-lg flex-shrink-0 leading-none" role="img">
        {displayIcon}
      </span>

      {/* Message */}
      <p className="flex-1 text-[13px] font-medium text-text leading-snug">
        {message}
      </p>

      {/* CTA */}
      {ctaLabel && (
        <button
          onClick={onCtaClick}
          className="
            text-[12px] font-semibold text-primary whitespace-nowrap
            active:opacity-70 transition-opacity flex-shrink-0
          "
        >
          {ctaLabel}
        </button>
      )}
    </div>
  )
}

/*
 * Usage:
 *
 * <InsightCard
 *   message="Tes posts du mardi marchent 2x mieux"
 *   type="stat"
 * />
 *
 * <InsightCard
 *   message="Publie entre 11h et 13h pour plus d'engagement"
 *   type="tip"
 *   ctaLabel="Voir"
 *   onCtaClick={() => router.visit('/statistics')}
 * />
 *
 * <InsightCard
 *   icon="🎯"
 *   message="Tu es a 1 post de ton objectif hebdo !"
 *   type="alert"
 * />
 */
