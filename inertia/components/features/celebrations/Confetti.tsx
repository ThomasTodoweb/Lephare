import { useEffect, useState } from 'react'

interface Particle {
  id: number
  emoji: string
  x: number
  delay: number
  duration: number
  size: number
}

interface ConfettiProps {
  type?: 'mission' | 'streak' | 'level' | 'generic'
  count?: number
}

const EMOJIS: Record<string, string[]> = {
  mission: ['🍴', '⭐', '👨‍🍳', '📸', '🎬', '✨'],
  streak: ['🔥', '⭐', '💪', '🏆', '✨'],
  level: ['🎉', '🏆', '🚀', '💎', '✨'],
  generic: ['✨', '⭐', '🎉', '💫'],
}

export function Confetti({ type = 'generic', count = 30 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const emojis = EMOJIS[type]
    setParticles(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        emoji: emojis[i % emojis.length],
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 1.5 + Math.random() * 1.5,
        size: 14 + Math.random() * 14,
      }))
    )
  }, [type, count])

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  )
}
