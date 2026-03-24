import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Lock, Check, Play, ChevronRight } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui/Card'

interface Tutorial {
  id: number
  title: string
  description: string | null
  durationMinutes: number
  requiredLevel: number
  isCompleted: boolean
  isLocked: boolean
}

interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  tutorials: Tutorial[]
}

interface Props {
  categories: Category[]
  userLevel: number
}

export default function TutorialsIndex({ categories, userLevel }: Props) {
  const [lockedMessage, setLockedMessage] = useState<string | null>(null)
  const totalTutorials = categories.reduce((acc, cat) => acc + cat.tutorials.length, 0)
  const completedTutorials = categories.reduce(
    (acc, cat) => acc + cat.tutorials.filter((t) => t.isCompleted).length,
    0
  )

  const handleLockedClick = (tutorial: Tutorial) => {
    setLockedMessage(`Niveau ${tutorial.requiredLevel} requis — Tu es niveau ${userLevel}`)
    setTimeout(() => setLockedMessage(null), 3000)
  }

  const nextTutorial = (() => {
    for (const cat of categories) {
      for (const t of cat.tutorials) {
        if (!t.isCompleted && !t.isLocked) return t
      }
    }
    return null
  })()

  const progressPercent = totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0

  return (
    <AppLayout>
      <Head title="Apprendre - Le Phare" />

      <div className="pb-28">
        {/* Header — clean, pas de gros bloc coloré */}
        <div className="mb-5">
          <h1 className="text-[22px] font-bold text-text">Apprendre</h1>
          <p className="text-[14px] text-text-secondary mt-1">Deviens un pro d'Instagram</p>

          {/* Progress bar compact */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 bg-bg-subtle rounded-full overflow-hidden">
              <div
                className="h-full bg-text rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[13px] font-semibold text-text tabular-nums">
              {completedTutorials}/{totalTutorials}
            </span>
          </div>
        </div>

        {/* Categories */}
        {categories.map((category) => {
          const catCompleted = category.tutorials.filter((t) => t.isCompleted).length
          return (
            <div key={category.id} className="mb-6">
              {/* Category header */}
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-[13px] font-semibold text-text-muted uppercase tracking-wider">
                  {category.name}
                </h2>
                <span className="text-[12px] text-text-muted tabular-nums">
                  {catCompleted}/{category.tutorials.length}
                </span>
              </div>

              {/* Tutorial cards */}
              <div className="space-y-2">
                {category.tutorials.map((tutorial) => {
                  const isNext = !tutorial.isCompleted && !tutorial.isLocked && nextTutorial?.id === tutorial.id

                  if (tutorial.isLocked) {
                    return (
                      <div
                        key={tutorial.id}
                        onClick={() => handleLockedClick(tutorial)}
                        className="flex items-center gap-3.5 p-3.5 bg-bg-subtle rounded-2xl opacity-50 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-neutral-200 flex items-center justify-center shrink-0">
                          <Lock size={14} className="text-neutral-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-text-muted truncate">{tutorial.title}</p>
                          <p className="text-[11px] text-text-muted mt-0.5">Niveau {tutorial.requiredLevel} requis</p>
                        </div>
                      </div>
                    )
                  }

                  if (tutorial.isCompleted) {
                    return (
                      <Link
                        key={tutorial.id}
                        href={`/tutorials/${tutorial.id}`}
                        className="flex items-center gap-3.5 p-3.5 bg-bg-card rounded-2xl shadow-xs active:scale-[0.98] transition-transform"
                      >
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <Check size={16} className="text-emerald-600" strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium text-text truncate">{tutorial.title}</p>
                          <p className="text-[12px] text-text-muted mt-0.5">{tutorial.durationMinutes} min</p>
                        </div>
                        <ChevronRight size={16} className="text-text-muted shrink-0" />
                      </Link>
                    )
                  }

                  if (isNext) {
                    return (
                      <Link
                        key={tutorial.id}
                        href={`/tutorials/${tutorial.id}`}
                        className="flex items-center gap-3.5 p-3.5 bg-bg-card rounded-2xl shadow-card border border-text/10 active:scale-[0.98] transition-transform"
                      >
                        <div className="w-10 h-10 rounded-xl bg-text flex items-center justify-center shrink-0">
                          <Play size={14} className="text-white ml-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-semibold text-text truncate">{tutorial.title}</p>
                          <p className="text-[12px] text-text-muted mt-0.5">{tutorial.durationMinutes} min</p>
                        </div>
                        <ChevronRight size={16} className="text-text-muted shrink-0" />
                      </Link>
                    )
                  }

                  // Accessible but not next
                  return (
                    <Link
                      key={tutorial.id}
                      href={`/tutorials/${tutorial.id}`}
                      className="flex items-center gap-3.5 p-3.5 bg-bg-card rounded-2xl shadow-xs active:scale-[0.98] transition-transform"
                    >
                      <div className="w-10 h-10 rounded-xl bg-bg-subtle border border-border flex items-center justify-center shrink-0">
                        <Play size={12} className="text-text-muted ml-0.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-text truncate">{tutorial.title}</p>
                        <p className="text-[12px] text-text-muted mt-0.5">{tutorial.durationMinutes} min</p>
                      </div>
                      <ChevronRight size={16} className="text-text-muted shrink-0" />
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-muted">Les tutos arrivent bientôt !</p>
          </div>
        )}
      </div>

      {/* Locked tutorial toast */}
      {lockedMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-text text-white px-4 py-2.5 rounded-full shadow-lg text-[12px] font-medium flex items-center gap-2 animate-fade-in">
          <Lock className="w-3 h-3 shrink-0" />
          {lockedMessage}
        </div>
      )}
    </AppLayout>
  )
}
