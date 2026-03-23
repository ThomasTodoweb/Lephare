import { Head, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { Button } from '~/components/ui/Button'
import { Confetti } from '~/components/features/celebrations/Confetti'
import { ArrowRight } from 'lucide-react'

interface Props {
  publication: {
    id: number
    imagePath: string
  }
  streak?: {
    current: number
    longest: number
  }
  xpEarned?: number
  isFirstPost?: boolean
}

export default function Bravo({ publication, streak, xpEarned, isFirstPost }: Props) {
  const [showStats, setShowStats] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [xpCounter, setXpCounter] = useState(0)

  useEffect(() => {
    // Staggered entrance
    const t1 = setTimeout(() => setShowStats(true), 800)
    const t2 = setTimeout(() => setShowButton(true), 1400)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  // Animate XP counter
  useEffect(() => {
    if (!showStats || !xpEarned) return
    const target = xpEarned
    const duration = 600
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setXpCounter(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [showStats, xpEarned])

  return (
    <>
      <Head title="Bravo ! - Le Phare" />
      <Confetti type="mission" count={35} />

      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 relative">
        {/* Main content */}
        <div className="text-center">
          {/* Photo with success badge */}
          <div className="relative inline-block mb-6 animate-scale-in">
            <div className="w-28 h-28 rounded-3xl overflow-hidden shadow-xl ring-4 ring-green-100">
              <img
                src={`/${publication.imagePath}`}
                alt="Votre publication"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white text-xl">✓</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-[26px] font-black text-text tracking-tight mb-2 animate-fade-up">
            {isFirstPost ? 'Première publication !' : 'Bien joué !'}
          </h1>

          <p className="text-[15px] text-text-secondary animate-fade-up" style={{ animationDelay: '100ms' }}>
            {isFirstPost
              ? 'Ta première publication est en ligne. Bienvenue dans l\'aventure !'
              : 'Ton contenu est maintenant visible sur Instagram.'}
          </p>
        </div>

        {/* Stats earned - animated entrance */}
        <div className={`flex items-center justify-center gap-4 mt-8 transition-all duration-500 ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {streak && streak.current > 0 && (
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-2xl">
              <span className="text-xl animate-wiggle">🔥</span>
              <div>
                <p className="text-[18px] font-black text-orange-600 leading-none">{streak.current}</p>
                <p className="text-[10px] text-orange-500 font-medium">jours</p>
              </div>
            </div>
          )}
          {xpEarned && xpEarned > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-4 py-2.5 rounded-2xl">
              <span className="text-xl">⭐</span>
              <div>
                <p className="text-[18px] font-black text-amber-600 leading-none animate-tick-up">+{xpCounter}</p>
                <p className="text-[10px] text-amber-500 font-medium">XP</p>
              </div>
            </div>
          )}
        </div>

        {/* Popote message */}
        <div className={`mt-6 max-w-[300px] text-center transition-all duration-500 ${showStats ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-[13px] text-text-muted italic">
            {streak && streak.current >= 7
              ? `"${streak.current} jours d'affilée, tu gères ! 💪"`
              : streak && streak.current >= 3
                ? '"Tu prends le rythme, continue comme ça !"'
                : '"Chaque publication compte. Tu fais un pas de plus !"'}
          </p>
        </div>

        {/* CTA */}
        <div className={`w-full max-w-[300px] mt-10 transition-all duration-500 ${showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Link href="/dashboard" className="block">
            <Button variant="primary" fullWidth size="lg" icon={ArrowRight} iconPosition="right">
              Continuer
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
