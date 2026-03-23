import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { Lock, Search } from 'lucide-react'
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

  return (
    <AppLayout>
      <Head title="Tutoriels - Le Phare" />

      {/* Header */}
      <div className="pt-6 pb-2">
        <h1 className="text-[22px] font-bold text-text">Formations</h1>
        <p className="text-[14px] text-text-secondary mt-1">
          Apprenez à créer du contenu qui engage
        </p>
      </div>

      {/* Progress */}
      <Card variant="bordered" className="mt-4">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[13px] font-medium text-text-secondary">Votre progression</span>
          <span className="text-[13px] font-semibold text-text">
            {completedTutorials}/{totalTutorials}
          </span>
        </div>
        <div className="w-full bg-bg-subtle rounded-full h-1.5">
          <div
            className="bg-text rounded-full h-1.5 transition-all"
            style={{ width: `${totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0}%` }}
          />
        </div>
      </Card>

      {/* Search link */}
      <div className="mt-4">
        <Link href="/tutorials/search">
          <Card variant="flat" className="flex items-center gap-3">
            <Search className="w-4 h-4 text-text-muted" />
            <span className="text-[14px] text-text-muted">Rechercher un tutoriel...</span>
          </Card>
        </Link>
      </div>

      {/* Categories */}
      <div className="mt-6 pb-8">
        {categories.map((category) => (
          <div key={category.id} className="mb-8">
            {/* Category header */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-text">{category.name}</h2>
                <span className="text-[12px] text-text-muted">
                  {category.tutorials.filter((t) => t.isCompleted).length}/{category.tutorials.length}
                </span>
              </div>
            </div>

            {/* Tutorials list */}
            <div className="flex flex-col gap-2">
              {category.tutorials.map((tutorial) =>
                tutorial.isLocked ? (
                  <div key={tutorial.id} className="block cursor-pointer" onClick={() => handleLockedClick(tutorial)}>
                    <Card variant="bordered" className="opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-bg-subtle shrink-0">
                          <Lock className="w-3.5 h-3.5 text-text-muted" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-semibold text-text-muted truncate">{tutorial.title}</h3>
                          <p className="text-[12px] text-text-muted mt-0.5">
                            Niveau {tutorial.requiredLevel} requis · {tutorial.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                ) : (
                  <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`} className="block">
                    <Card variant={tutorial.isCompleted ? 'bordered' : 'default'}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tutorial.isCompleted ? 'bg-emerald-50' : 'bg-bg-subtle'}`}>
                          {tutorial.isCompleted ? (
                            <span className="text-emerald-600 text-[13px] font-bold">✓</span>
                          ) : (
                            <span className="text-text-muted text-[12px]">▶</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-semibold text-text truncate">{tutorial.title}</h3>
                          {tutorial.description && (
                            <p className="text-[13px] text-text-secondary line-clamp-1 mt-0.5">
                              {tutorial.description}
                            </p>
                          )}
                          <p className="text-[12px] text-text-muted mt-1">
                            {tutorial.durationMinutes} min
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              )}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-secondary">Aucun tutoriel disponible pour le moment</p>
          </div>
        )}
      </div>

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
