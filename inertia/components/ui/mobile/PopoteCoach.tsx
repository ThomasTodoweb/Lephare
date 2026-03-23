import { type ReactNode } from 'react'

export interface PopoteCoachProps {
  message: string
  variant?: 'default' | 'positive' | 'warning'
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const VARIANT_STYLES = {
  default: {
    bg: 'bg-bg-subtle',
    border: 'border-border-light',
    label: 'text-text-muted',
  },
  positive: {
    bg: 'bg-success-light',
    border: 'border-green-100',
    label: 'text-green-600',
  },
  warning: {
    bg: 'bg-warning-light',
    border: 'border-amber-100',
    label: 'text-amber-600',
  },
} as const

export function PopoteCoach({
  message,
  variant = 'default',
  actionLabel,
  onAction,
  className = '',
}: PopoteCoachProps) {
  const styles = VARIANT_STYLES[variant]

  return (
    <div
      className={`
        ${styles.bg} border ${styles.border}
        rounded-2xl p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Popote avatar */}
        <div className="w-8 h-8 rounded-full bg-white border-2 border-border flex-shrink-0 overflow-hidden flex items-center justify-center">
          <img
            src="/images/popote.png"
            alt="Popote"
            className="w-full h-full object-contain p-0.5"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
              ;(e.target as HTMLImageElement).parentElement!.innerHTML =
                '<span class="text-xs">🍳</span>'
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span
            className={`
              text-[10px] font-bold uppercase tracking-widest
              ${styles.label}
              block mb-1
            `}
          >
            Conseil de Popote
          </span>

          <p className="text-[13px] text-text leading-relaxed">
            {message}
          </p>

          {actionLabel && (
            <button
              onClick={onAction}
              className="
                mt-2.5 text-[12px] font-semibold text-primary
                active:opacity-70 transition-opacity
              "
            >
              {actionLabel} →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/*
 * Usage:
 *
 * <PopoteCoach
 *   message="Tes posts du mardi performent 2x mieux. Essaie de publier en debut de semaine !"
 *   variant="default"
 * />
 *
 * <PopoteCoach
 *   message="Super, tu as publie 3 jours de suite !"
 *   variant="positive"
 * />
 *
 * <PopoteCoach
 *   message="Ta streak est en danger, publie aujourd'hui pour la garder."
 *   variant="warning"
 *   actionLabel="Voir les stats"
 *   onAction={() => router.visit('/statistics')}
 * />
 */
