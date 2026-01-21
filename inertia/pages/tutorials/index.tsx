import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui/Card'

interface Tutorial {
  id: number
  title: string
  description: string | null
  durationMinutes: number
  isCompleted: boolean
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
}

const CATEGORY_ICONS: Record<string, string> = {
  'premiers-pas': '🚀',
  'photos-videos': '📸',
  'stories-reels': '🎬',
  post: '📸',
  story: '📱',
  reel: '🎬',
}

export default function TutorialsIndex({ categories }: Props) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const totalTutorials = categories.reduce((acc, cat) => acc + cat.tutorials.length, 0)
  const completedTutorials = categories.reduce(
    (acc, cat) => acc + cat.tutorials.filter((t) => t.isCompleted).length,
    0
  )

  return (
    <AppLayout>
      <Head title="Tutoriels - Le Phare" />
      {/* Header */}
      <div className="pt-4 pb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Formations
          </h1>
          {/* View mode toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Vue liste"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Vue grille"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
        <p className="text-neutral-600 mt-2">
          Apprenez à créer du contenu qui engage
        </p>

        {/* Progress */}
        <div className="mt-4 bg-white rounded-xl p-4 border-2 border-neutral-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-700">Votre progression</span>
            <span className="text-sm font-bold text-primary">
              {completedTutorials}/{totalTutorials} tutos
            </span>
          </div>
          <div className="w-full bg-neutral-200 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${totalTutorials > 0 ? (completedTutorials / totalTutorials) * 100 : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search link */}
      <div className="mb-4">
        <Link
          href="/tutorials/search"
          className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-neutral-500 hover:border-primary transition-colors"
        >
          <span className="text-xl">🔍</span>
          <span>Rechercher un tutoriel...</span>
        </Link>
      </div>

      {/* Categories */}
      <div className="pb-8">
          {categories.map((category) => (
            <div key={category.id} className="mb-6">
              {/* Category header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{CATEGORY_ICONS[category.slug] || '📚'}</span>
                <div>
                  <h2 className="text-lg font-bold text-neutral-900">{category.name}</h2>
                  <p className="text-sm text-neutral-500">
                    {category.tutorials.filter((t) => t.isCompleted).length}/{category.tutorials.length} vus
                  </p>
                </div>
              </div>

              {/* Tutorials - List or Grid view */}
              {viewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {category.tutorials.map((tutorial) => (
                    <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`} className="block">
                      <Card className={`${tutorial.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tutorial.isCompleted ? 'bg-green-100' : 'bg-neutral-100'}`}>
                            {tutorial.isCompleted ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-neutral-400">▶</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-neutral-900">{tutorial.title}</h3>
                            {tutorial.description && (
                              <p className="text-sm text-neutral-600 line-clamp-2 mt-1">
                                {tutorial.description}
                              </p>
                            )}
                            <p className="text-xs text-neutral-500 mt-2">
                              ⏱ {tutorial.durationMinutes} min
                            </p>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {category.tutorials.map((tutorial) => (
                    <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
                      <Card className={`h-full ${tutorial.isCompleted ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex flex-col items-center text-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${tutorial.isCompleted ? 'bg-green-100' : 'bg-neutral-100'}`}>
                            {tutorial.isCompleted ? (
                              <span className="text-green-600 text-xl">✓</span>
                            ) : (
                              <span className="text-neutral-400 text-xl">▶</span>
                            )}
                          </div>
                          <h3 className="font-bold text-neutral-900 text-sm line-clamp-2">{tutorial.title}</h3>
                          <p className="text-xs text-neutral-500 mt-2">
                            ⏱ {tutorial.durationMinutes} min
                          </p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <span className="text-5xl mb-4 block">📚</span>
            <p className="text-neutral-600">Aucun tutoriel disponible pour le moment</p>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
