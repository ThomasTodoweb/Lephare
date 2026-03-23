import { useState } from 'react'
import { Button } from '~/components/ui/Button'
import { Confetti } from './Confetti'

interface StreakMilestoneProps {
  days: number
  onDismiss: () => void
}

const MILESTONES: Record<number, { title: string; emoji: string; message: string; gradient: string }> = {
  7: {
    title: '1 semaine !',
    emoji: '🌟',
    message: 'Une semaine complète ! Tu prends le rythme.',
    gradient: 'from-blue-500 to-cyan-400',
  },
  14: {
    title: '2 semaines !',
    emoji: '🔥',
    message: '14 jours non-stop. Ton Insta va décoller.',
    gradient: 'from-orange-500 to-amber-400',
  },
  30: {
    title: '1 MOIS !',
    emoji: '🏆',
    message: 'Un mois de régularité ! Seulement 5% des restaurateurs y arrivent.',
    gradient: 'from-purple-600 to-pink-500',
  },
  60: {
    title: 'LÉGENDAIRE',
    emoji: '💎',
    message: '60 jours. Tu es dans le top 1% des restaurateurs sur Insta.',
    gradient: 'from-emerald-500 to-teal-400',
  },
  100: {
    title: 'CENTURION',
    emoji: '👑',
    message: '100 jours. Tu es une légende. Ton restaurant rayonne.',
    gradient: 'from-amber-500 to-yellow-300',
  },
}

export function StreakMilestone({ days, onDismiss }: StreakMilestoneProps) {
  const milestone = MILESTONES[days]
  if (!milestone) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6" onClick={onDismiss}>
      <Confetti type="streak" count={40} />
      <div
        className="bg-white rounded-3xl p-8 text-center max-w-[320px] w-full animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br ${milestone.gradient} flex items-center justify-center text-4xl mb-5 shadow-lg`}>
          {milestone.emoji}
        </div>
        <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1">
          Streak de {days} jours
        </p>
        <h2 className="text-[24px] font-black text-text mb-3">{milestone.title}</h2>
        <p className="text-[14px] text-text-secondary leading-relaxed mb-6">
          {milestone.message}
        </p>
        <Button variant="primary" fullWidth onClick={onDismiss}>
          Continuer
        </Button>
      </div>
    </div>
  )
}
