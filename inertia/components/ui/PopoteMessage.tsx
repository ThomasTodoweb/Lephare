import { useState, useEffect, useCallback } from 'react'
import { PopoteAvatar, type PopoteAvatarProps } from './PopoteAvatar'

/**
 * PopoteMessage - Affiche Popote avec un message en typewriter
 *
 * L'avatar sautille pendant que le texte s'écrit lettre par lettre.
 * Cliquer sur le composant affiche le texte complet instantanément.
 *
 * @example
 * <PopoteMessage message="Bravo ! Tu as publié 5 fois cette semaine !" variant="happy" />
 * <PopoteMessage message="Analysons ta photo ensemble..." variant="default" size="lg" />
 */

export interface PopoteMessageProps {
  message: string
  variant?: PopoteAvatarProps['variant']
  size?: PopoteAvatarProps['size']
  className?: string
  /** Vitesse du typewriter en ms par caractère (défaut: 50ms) */
  typeSpeed?: number
  /** Callback appelé quand le message est entièrement affiché */
  onComplete?: () => void
}

export function PopoteMessage({
  message,
  variant = 'default',
  size = 'md',
  className = '',
  typeSpeed = 50,
  onComplete,
}: PopoteMessageProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  const isComplete = displayedText.length >= message.length

  // Skip au clic - affiche tout le texte instantanément
  const handleSkip = useCallback(() => {
    if (!isComplete) {
      setDisplayedText(message)
      setIsTyping(false)
      onComplete?.()
    }
  }, [isComplete, message, onComplete])

  // Effet typewriter
  useEffect(() => {
    if (isComplete) {
      setIsTyping(false)
      onComplete?.()
      return
    }

    const timer = setTimeout(() => {
      setDisplayedText(message.slice(0, displayedText.length + 1))
    }, typeSpeed)

    return () => clearTimeout(timer)
  }, [displayedText, message, typeSpeed, isComplete, onComplete])

  // Reset si le message change
  useEffect(() => {
    setDisplayedText('')
    setIsTyping(true)
  }, [message])

  return (
    <div
      className={`flex items-start gap-3 cursor-pointer ${className}`}
      onClick={handleSkip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSkip()}
      aria-label={isTyping ? 'Cliquer pour afficher le message complet' : undefined}
    >
      {/* Avatar avec animation bounce */}
      <div className={isTyping ? 'animate-bounce-subtle' : ''}>
        <PopoteAvatar size={size} variant={variant} />
      </div>

      {/* Bulle de texte */}
      <div className="flex-1 bg-white border-2 border-neutral rounded-2xl px-4 py-3 relative">
        {/* Flèche vers l'avatar */}
        <div className="absolute left-0 top-3 -translate-x-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
        <div className="absolute left-0 top-3 -translate-x-[10px] w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-neutral" />

        <p className="text-sm text-neutral-700 leading-relaxed">
          {displayedText}
          {isTyping && <span className="animate-pulse">|</span>}
        </p>
      </div>
    </div>
  )
}
