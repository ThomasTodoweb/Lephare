import { useEffect, useState, useCallback } from 'react'

export interface CelebrationReward {
  emoji: string
  label: string
}

export interface CelebrationOverlayProps {
  visible: boolean
  title?: string
  subtitle?: string
  emoji?: string
  rewards?: CelebrationReward[]
  autoDismissMs?: number | false
  onDismiss: () => void
  className?: string
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#dd2c0c', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.6
  const duration = 1.5 + Math.random() * 1.5
  const rotation = Math.random() * 360
  const size = 6 + Math.random() * 6

  return (
    <div
      className="absolute top-0 animate-confetti-fall"
      style={{
        left: `${left}%`,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div
        style={{
          width: size,
          height: size * 0.6,
          backgroundColor: color,
          borderRadius: 1,
          transform: `rotate(${rotation}deg)`,
        }}
      />
    </div>
  )
}

export function CelebrationOverlay({
  visible,
  title = 'Bravo !',
  subtitle,
  emoji = '🎉',
  rewards = [],
  autoDismissMs = 5000,
  onDismiss,
  className = '',
}: CelebrationOverlayProps) {
  const [show, setShow] = useState(false)
  const [contentVisible, setContentVisible] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const timer = setTimeout(() => setContentVisible(true), 100)
      return () => clearTimeout(timer)
    } else {
      setContentVisible(false)
      const timer = setTimeout(() => setShow(false), 300)
      return () => clearTimeout(timer)
    }
  }, [visible])

  useEffect(() => {
    if (visible && autoDismissMs) {
      const timer = setTimeout(onDismiss, autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [visible, autoDismissMs, onDismiss])

  if (!show) return null

  return (
    <div
      className={`
        fixed inset-0 z-50 flex flex-col items-center justify-center
        transition-opacity duration-300
        ${contentVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onDismiss} />

      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <ConfettiPiece key={i} index={i} />
        ))}
      </div>

      {/* Content */}
      <div
        className={`
          relative z-10 flex flex-col items-center text-center px-8
          transition-all duration-500
          ${contentVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-4'}
        `}
      >
        {/* Big emoji */}
        <div className="text-[64px] mb-4 animate-celebration-bounce">
          {emoji}
        </div>

        {/* Title */}
        <h1 className="text-[32px] font-bold text-white mb-2">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-white/80 text-[15px] mb-6 max-w-[260px]">
            {subtitle}
          </p>
        )}

        {/* Rewards */}
        {rewards.length > 0 && (
          <div className="flex items-center gap-4 mb-8">
            {rewards.map((reward, i) => (
              <div
                key={i}
                className="
                  flex items-center gap-1.5
                  bg-white/15 backdrop-blur-sm
                  rounded-full px-4 py-2
                "
              >
                <span className="text-base">{reward.emoji}</span>
                <span className="text-white text-[13px] font-semibold">
                  {reward.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onDismiss}
          className="
            bg-white text-text font-semibold
            text-[15px] px-8 py-3.5 rounded-xl
            active:scale-95 transition-transform duration-150
            shadow-lg
          "
        >
          Continuer
        </button>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-10px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti-fall {
          animation: confetti-fall 2.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        @keyframes celebration-bounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.2); }
          50% { transform: scale(0.95); }
          75% { transform: scale(1.1); }
        }
        .animate-celebration-bounce {
          animation: celebration-bounce 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  )
}

/*
 * Usage:
 *
 * const [showCelebration, setShowCelebration] = useState(false)
 *
 * <CelebrationOverlay
 *   visible={showCelebration}
 *   title="Bravo !"
 *   subtitle="Tu as complete ta mission du jour"
 *   emoji="🎉"
 *   rewards={[
 *     { emoji: '🔥', label: '+1 streak' },
 *     { emoji: '⭐', label: '+25 XP' },
 *   ]}
 *   onDismiss={() => setShowCelebration(false)}
 * />
 *
 * // Without auto-dismiss:
 * <CelebrationOverlay
 *   visible={showCelebration}
 *   autoDismissMs={false}
 *   onDismiss={() => setShowCelebration(false)}
 * />
 */
