import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'

interface Tutorial {
  id: number
  title: string
  description: string | null
  durationMinutes: number
  categoryName: string | null
  isCompleted: boolean
}

interface Props {
  query: string
  tutorials: Tutorial[]
}

export default function TutorialsSearch({ query: initialQuery, tutorials }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (query.length >= 2) {
      setIsSearching(true)
      const timeout = setTimeout(() => {
        router.get('/tutorials/search', { q: query }, {
          preserveState: true,
          preserveScroll: true,
          onFinish: () => setIsSearching(false),
        })
      }, 300)
      return () => clearTimeout(timeout)
    }
  }, [query])

  return (
    <AppLayout>
      <Head title="Rechercher - Tutoriels - Le Phare" />
      {/* Header */}
      <div className="pb-4">
        <Link href="/tutorials" className="text-primary text-sm mb-2 inline-block">
          ← Retour aux tutoriels
        </Link>
        <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
          Rechercher
        </h1>
      </div>

      {/* Search input */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Tapez votre recherche..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Results */}
      <div className="pb-8">
          {isSearching && (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-neutral-600 mt-2">Recherche en cours...</p>
            </div>
          )}

          {!isSearching && query.length >= 2 && tutorials.length === 0 && (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-neutral-600">Aucun tutoriel trouvé pour "{query}"</p>
            </div>
          )}

          {!isSearching && query.length < 2 && (
            <div className="text-center py-12">
              <span className="text-5xl mb-4 block">✨</span>
              <p className="text-neutral-600">Tapez au moins 2 caractères pour rechercher</p>
            </div>
          )}

          {!isSearching && tutorials.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-neutral-500 mb-4">
                {tutorials.length} résultat{tutorials.length > 1 ? 's' : ''} trouvé{tutorials.length > 1 ? 's' : ''}
              </p>
              {tutorials.map((tutorial) => (
                <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
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
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-neutral-900">{tutorial.title}</h3>
                        </div>
                        {tutorial.categoryName && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                            {tutorial.categoryName}
                          </span>
                        )}
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
        )}
      </div>
    </AppLayout>
  )
}
