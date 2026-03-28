import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { ChevronLeft, Search, Check, Play } from 'lucide-react'
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
        <Link href="/tutorials" className="inline-flex items-center gap-1 text-[13px] text-text-secondary min-h-[44px] -ml-1 pl-1 pr-2">
          <ChevronLeft className="w-4 h-4" />
          Tutoriels
        </Link>
        <h1 className="text-[20px] font-bold text-text tracking-tight">Rechercher</h1>
      </div>

      {/* Search input */}
      <div className="mb-6">
        <div className="flex items-center gap-3 bg-bg-subtle rounded-2xl p-4">
          <Search className="w-4 h-4 text-text-muted shrink-0" />
          <input
            type="text"
            placeholder="Tapez votre recherche..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-[14px] text-text placeholder:text-text-muted outline-none min-h-[24px]"
          />
        </div>
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
            <div className="w-14 h-14 mx-auto mb-4 bg-bg-subtle rounded-2xl flex items-center justify-center">
              <Search className="w-6 h-6 text-text-muted" />
            </div>
            <p className="text-[15px] font-semibold text-text mb-1">Aucun resultat</p>
            <p className="text-[13px] text-text-muted">Essaie avec d'autres mots-cles pour "{query}"</p>
          </div>
        )}

        {!isSearching && query.length < 2 && (
          <div className="text-center py-16">
            <p className="text-[14px] text-text-muted">Tape au moins 2 caracteres pour rechercher</p>
          </div>
        )}

        {!isSearching && tutorials.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3">
              {tutorials.length} resultat{tutorials.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-2.5">
              {tutorials.map((tutorial) => (
                <Link
                  key={tutorial.id}
                  href={`/tutorials/${tutorial.id}`}
                  className="block active:scale-[0.98] transition-transform"
                >
                  <Card variant={tutorial.isCompleted ? 'bordered' : 'default'}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tutorial.isCompleted ? 'bg-success-light' : 'bg-bg-subtle'}`}>
                        {tutorial.isCompleted ? (
                          <Check size={16} className="text-success" strokeWidth={2.5} />
                        ) : (
                          <Play size={12} className="text-text-muted ml-0.5" />
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
                          <p className="text-[13px] text-text-secondary line-clamp-1 mt-0.5 leading-relaxed">
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
