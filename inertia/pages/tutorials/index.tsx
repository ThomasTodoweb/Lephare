import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Lock, Check, Play } from 'lucide-react'
import { AppLayout } from '~/components/layout'

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

  // Find the next uncompleted, unlocked tutorial
  const nextTutorial = (() => {
    for (const cat of categories) {
      for (const t of cat.tutorials) {
        if (!t.isCompleted && !t.isLocked) return t
      }
    }
    return null
  })()

  return (
    <AppLayout>
      <Head title="Tutoriels - Le Phare" />

      {/* Header */}
      <div className="bg-gradient-to-br from-[#dd2c0c] to-[#ff6b4f] rounded-b-3xl -mx-4 px-5 pt-8 pb-6">
        <h1 className="text-[22px] font-black text-white">Apprendre</h1>
        <p className="text-[14px] text-white/80 mt-1">Deviens un pro d'Instagram</p>
        <div className="bg-white/20 rounded-2xl px-3 py-2 mt-3 inline-flex items-center gap-2">
          <span className="text-[14px] font-bold text-white">
            {completedTutorials}/{totalTutorials}
          </span>
          <span className="text-[12px] text-white/80">complétés</span>
        </div>
      </div>

      {/* Categories with connected tutorials */}
      <div className="mt-6 pb-28">
        {categories.map((category) => {
          const catCompleted = category.tutorials.filter((t) => t.isCompleted).length
          return (
            <div key={category.id} className="mb-8">
              {/* Category header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[15px] font-semibold text-text">{category.name}</h2>
                <span className="text-[12px] text-text-muted">
                  {catCompleted}/{category.tutorials.length} complétés
                </span>
              </div>

              {/* Tutorial list with connection line */}
              <div className="relative">
                {/* Vertical connection line */}
                <div className="absolute left-6 top-5 bottom-5 w-0.5 bg-border" />

                <div className="flex flex-col gap-1">
                  {category.tutorials.map((tutorial, idx) => {
                    // Determine state
                    const isNext =
                      !tutorial.isCompleted &&
                      !tutorial.isLocked &&
                      nextTutorial?.id === tutorial.id
                    const isAccessible = !tutorial.isCompleted && !tutorial.isLocked && !isNext

                    if (tutorial.isLocked) {
                      return (
                        <div
                          key={tutorial.id}
                          className="relative flex items-center gap-4 pl-12 py-2.5 cursor-pointer opacity-50"
                          onClick={() => handleLockedClick(tutorial)}
                        >
                          {/* Circle */}
                          <div className="absolute left-2 w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                            <Lock size={14} className="text-neutral-400" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-text-muted truncate">
                              {tutorial.title}
                            </h3>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              Niveau {tutorial.requiredLevel} requis
                            </p>
                          </div>
                        </div>
                      )
                    }

                    if (tutorial.isCompleted) {
                      return (
                        <Link
                          key={tutorial.id}
                          href={`/tutorials/${tutorial.id}`}
                          className="relative flex items-center gap-4 pl-12 py-2.5"
                        >
                          {/* Circle */}
                          <div className="absolute left-2 w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-text truncate">
                              {tutorial.title}
                            </h3>
                            <p className="text-[12px] text-text-muted mt-0.5">
                              {tutorial.durationMinutes} min
                            </p>
                          </div>
                        </Link>
                      )
                    }

                    if (isNext) {
                      return (
                        <Link
                          key={tutorial.id}
                          href={`/tutorials/${tutorial.id}`}
                          className="relative flex items-center gap-4 pl-12 py-2.5"
                        >
                          {/* Circle - current */}
                          <div className="absolute left-2 w-10 h-10 rounded-full bg-primary ring-4 ring-primary/20 flex items-center justify-center">
                            <Play size={14} className="text-white ml-0.5" />
                          </div>
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[15px] font-semibold text-text truncate">
                              {tutorial.title}
                            </h3>
                            <p className="text-[12px] text-text-muted mt-0.5">
                              {tutorial.durationMinutes} min
                            </p>
                          </div>
                        </Link>
                      )
                    }

                    // Accessible but not next
                    return (
                      <Link
                        key={tutorial.id}
                        href={`/tutorials/${tutorial.id}`}
                        className="relative flex items-center gap-4 pl-12 py-2.5"
                      >
                        {/* Circle - accessible */}
                        <div className="absolute left-2 w-10 h-10 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center">
                          <span className="text-[12px] text-text-muted">{idx + 1}</span>
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[15px] font-semibold text-text truncate">
                            {tutorial.title}
                          </h3>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            {tutorial.durationMinutes} min
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-secondary">Aucun tutoriel disponible pour le moment</p>
          </div>
        )}
      </div>

      {/* Next tutorial sticky bar */}
      {nextTutorial && (
        <Link
          href={`/tutorials/${nextTutorial.id}`}
          className="fixed bottom-20 left-4 right-4 bg-bg-card rounded-2xl shadow-float p-4 flex items-center gap-3 z-40 max-w-[428px] mx-auto"
        >
          <div className="flex-1 min-w-0">
            <span className="text-[11px] text-text-muted font-medium">{nextTutorial.durationMinutes} min</span>
            <p className="text-[14px] font-semibold text-text truncate mt-0.5">{nextTutorial.title}</p>
          </div>
          <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Play size={18} className="text-white ml-0.5" />
          </div>
        </Link>
      )}

      {/* Locked tutorial toast */}
      {lockedMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-text text-white px-4 py-3 rounded-xl shadow-card text-[13px] font-medium flex items-center gap-2 animate-fade-in max-w-[380px]">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          {lockedMessage}
        </div>
      )}
    </AppLayout>
  )
}
