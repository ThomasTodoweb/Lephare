export interface StreakWidgetProps {
  count: number
  atRisk?: boolean
  className?: string
}

export function StreakWidget({ count, atRisk = false, className = '' }: StreakWidgetProps) {
  const shouldWiggle = count > 7

  return (
    <div
      className={`
        inline-flex items-center gap-2.5 px-4 py-2.5
        rounded-[var(--radius-lg)] border
        ${atRisk
          ? 'bg-orange-50 border-orange-200 animate-streak-pulse'
          : 'bg-orange-50 border-orange-100'
        }
        ${className}
      `}
    >
      <span
        className={`text-2xl leading-none ${shouldWiggle ? 'animate-wiggle' : ''}`}
        role="img"
        aria-label="streak"
      >
        🔥
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-bold text-streak leading-none tabular-nums">
          {count}
        </span>
        <span className="text-[12px] text-text-muted font-medium">
          {count <= 1 ? 'jour' : 'jours'}
        </span>
      </div>

      {/* Inline keyframes for wiggle and pulse */}
      <style>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg); }
          15% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          45% { transform: rotate(-8deg); }
          60% { transform: rotate(6deg); }
          75% { transform: rotate(-3deg); }
        }
        .animate-wiggle {
          animation: wiggle 1.2s ease-in-out infinite;
          transform-origin: bottom center;
        }
        @keyframes streak-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-streak-pulse {
          animation: streak-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

/*
 * Usage:
 *
 * <StreakWidget count={5} />
 * <StreakWidget count={12} />           // flamme animee (wiggle)
 * <StreakWidget count={3} atRisk />     // pulsation douce
 */
