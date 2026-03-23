import { Head, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
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
}

export default function Bravo({ publication, streak, xpEarned }: Props) {
  return (
    <>
      <Head title="Bravo ! - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6">
        {/* Success animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg">
            <img
              src={`/${publication.imagePath}`}
              alt="Votre publication"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-md animate-scale-in">
            <span className="text-white text-lg">✓</span>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-[22px] font-bold text-text tracking-tight mb-2">
          Publié avec succès
        </h1>
        <p className="text-[14px] text-text-secondary text-center max-w-[280px] mb-2">
          Votre contenu est maintenant visible sur Instagram.
        </p>

        {/* Stats earned */}
        {(streak || xpEarned) && (
          <div className="flex items-center gap-4 mt-4 mb-8">
            {streak && streak.current > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-xl">
                <span className="text-base">🔥</span>
                <span className="text-[14px] font-bold text-orange-600">{streak.current}j</span>
              </div>
            )}
            {xpEarned && xpEarned > 0 && (
              <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl">
                <span className="text-base">⭐</span>
                <span className="text-[14px] font-bold text-amber-600">+{xpEarned} XP</span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="w-full max-w-[300px] space-y-3 mt-4">
          <Link href="/dashboard" className="block">
            <Button variant="primary" fullWidth icon={ArrowRight} iconPosition="right">
              Continuer
            </Button>
          </Link>
        </div>
      </div>
    </>
  )
}
