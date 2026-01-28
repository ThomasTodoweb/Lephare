import { Head, Link } from '@inertiajs/react'
import { Lock, ArrowLeft, Star, BookOpen } from 'lucide-react'
import { AppLayout } from '~/components/layout'

interface Props {
  tutorial: {
    id: number
    title: string
    requiredLevel: number
  }
  userLevel: number
}

export default function TutorialLocked({ tutorial, userLevel }: Props) {
  return (
    <AppLayout>
      <Head title={`${tutorial.title} - Verrouillé`} />

      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
        {/* Lock icon */}
        <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-neutral-400" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-neutral-900 mb-2">{tutorial.title}</h1>
        <p className="text-neutral-500 mb-6">Ce tutoriel est verrouillé</p>

        {/* Level comparison */}
        <div className="bg-white rounded-2xl border-2 border-neutral-200 p-6 w-full max-w-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">Ton niveau</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                <span className="text-2xl font-bold text-neutral-900">{userLevel}</span>
              </div>
            </div>
            <div className="text-2xl text-neutral-300">→</div>
            <div className="text-center">
              <p className="text-xs text-neutral-500 mb-1">Niveau requis</p>
              <div className="flex items-center gap-1.5">
                <Lock className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-primary">{tutorial.requiredLevel}</span>
              </div>
            </div>
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-primary to-accent rounded-full h-2 transition-all"
              style={{ width: `${Math.min(100, (userLevel / tutorial.requiredLevel) * 100)}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">
            Encore {tutorial.requiredLevel - userLevel} niveau{tutorial.requiredLevel - userLevel > 1 ? 'x' : ''} pour débloquer
          </p>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 w-full max-w-sm mb-6">
          <h3 className="font-bold text-amber-800 text-sm mb-2">Comment gagner de l'XP ?</h3>
          <ul className="text-sm text-amber-700 space-y-1.5 text-left">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📸</span>
              <span>Complete tes missions quotidiennes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">📚</span>
              <span>Regarde les tutoriels disponibles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">🔥</span>
              <span>Maintiens ton streak actif</span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            href="/tutorials"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-primary text-white font-bold uppercase tracking-wide rounded-full hover:bg-primary-dark transition-colors min-h-[44px]"
          >
            <BookOpen className="w-5 h-5" />
            Voir les tutoriels disponibles
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-neutral-100 text-neutral-700 font-medium rounded-full hover:bg-neutral-200 transition-colors min-h-[44px]"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
