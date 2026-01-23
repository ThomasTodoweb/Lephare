import { useState } from 'react'

/**
 * PopoteAvatar - Composant avatar de la mascotte IA "Popote"
 *
 * Affiche l'avatar de Popote avec deux variantes :
 * - default : bras croisés, expression déterminée (analyses, conseils)
 * - happy : pouce levé, souriant (félicitations, résultats positifs)
 *
 * @example
 * <PopoteAvatar size="md" variant="default" />
 * <PopoteAvatar size="lg" variant="happy" />
 */

export interface PopoteAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'happy'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6', // 24px
  md: 'w-10 h-10', // 40px
  lg: 'w-16 h-16', // 64px
}

const VARIANT_IMAGES = {
  default: '/images/popote.png',
  happy: '/images/popote-happy.png',
}

export function PopoteAvatar({ size = 'md', variant = 'default', className = '' }: PopoteAvatarProps) {
  const [hasError, setHasError] = useState(false)

  return (
    <div
      className={`${SIZE_CLASSES[size]} rounded-full bg-white border-2 border-neutral flex items-center justify-center overflow-hidden ${className}`}
    >
      {hasError ? (
        <span className="text-xs text-neutral-400">🍳</span>
      ) : (
        <img
          src={VARIANT_IMAGES[variant]}
          alt="Popote, assistant IA de Le Phare"
          className="w-full h-full object-contain p-0.5"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  )
}
