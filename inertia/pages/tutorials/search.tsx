import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { ChevronLeft, Search } from 'lucide-react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui/Card'

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
      <div className="pt-4 pb-4">
        <Link href="/tutorials" className="inline-flex items-center gap-1 text-[13px] text-text-secondary mb-3">
          <ChevronLeft className="w-4 h-4" />
          Tutoriels
        </Link>
        <h1 className="text-[20px] font-bold text-text">Rechercher</h1>
      </div>

      {/* Search input */}
      <div className="mb-6">
        <Card variant="flat" className="flex items-center gap-3">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Tapez votre recherche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-[14px] text-text placeholder:text-text-muted outline-none"
          />
        </Card>
      </div>

      {/* Results */}
      <div className="pb-8">
        {isSearching && (
          <div className="text-center py-12">
            <div className="w-6 h-6 border-2 border-text border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[13px] text-text-muted mt-3">Recherche en cours...</p>
          </div>
        )}

        {!isSearching && query.length >= 2 && tutorials.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-secondary">Aucun tutoriel trouvé pour "{query}"</p>
          </div>
        )}

        {!isSearching && query.length < 2 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-muted">Tapez au moins 2 caractères pour rechercher</p>
          </div>
        )}

        {!isSearching && tutorials.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
              {tutorials.length} résultat{tutorials.length > 1 ? 's' : ''}
            </p>
            <div className="flex flex-col gap-2">
              {tutorials.map((tutorial) => (
                <Link key={tutorial.id} href={`/tutorials/${tutorial.id}`}>
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
                        {tutorial.categoryName && (
                          <span className="text-[11px] font-medium text-text-muted">
                            {tutorial.categoryName}
                          </span>
                        )}
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
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
