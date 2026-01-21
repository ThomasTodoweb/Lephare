import { Head, Link } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { Card } from '~/components/ui'

interface KeyMetric {
  type: string
  label: string
  value: number
  icon: string
}

interface Summary {
  totalMissions: number
  totalTutorials: number
  totalPublications: number
  byType: {
    posts: number
    stories: number
    reels: number
    tutos: number
  }
}

interface Comparison {
  current: number
  previous: number
  change: number
  changePercent: number
}

interface EvolutionPoint {
  date: string
  value: number
}

interface Interpretation {
  text: string
  sentiment: 'positive' | 'neutral' | 'negative'
}

interface InstagramStats {
  followers: {
    current: number
    growthDaily: number
    growthWeekly: number
    growthMonthly: number
  }
  engagement: {
    impressions: number
    reach: number
    likes: number
    comments: number
    shares: number
    saves: number
    averageRate: number
  }
  postsCount: number
  lastUpdated: string | null
}

interface InstagramComparison {
  current: InstagramStats
  previous: InstagramStats | null
  changes: {
    followers: number
    followersPercent: number
    impressions: number
    impressionsPercent: number
    reach: number
    reachPercent: number
    engagementRate: number
  }
}

interface Props {
  keyMetrics: KeyMetric[]
  summary: Summary
  comparison: Comparison
  instagram: InstagramStats | null
  instagramComparison: InstagramComparison | null
}

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

export default function StatisticsIndex({ keyMetrics, summary, comparison, instagram: initialInstagram, instagramComparison: initialInstagramComparison }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30')
  const [evolution, setEvolution] = useState<EvolutionPoint[]>([])
  const [isLoadingEvolution, setIsLoadingEvolution] = useState(false)
  const [interpretation, setInterpretation] = useState<Interpretation | null>(null)
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(true)
  const [instagram, setInstagram] = useState<InstagramStats | null>(initialInstagram)
  const [instagramComparison, setInstagramComparison] = useState<InstagramComparison | null>(initialInstagramComparison)
  const [isRefreshingInstagram, setIsRefreshingInstagram] = useState(false)

  const refreshInstagramStats = async () => {
    setIsRefreshingInstagram(true)
    try {
      const response = await fetch('/statistics/instagram/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken() || '',
        },
      })
      if (response.ok) {
        const data = await response.json()
        setInstagram(data.instagram)
        setInstagramComparison(data.instagramComparison)
      }
    } catch (error) {
      console.error('Failed to refresh Instagram stats:', error)
    } finally {
      setIsRefreshingInstagram(false)
    }
  }

  // Fetch AI interpretation on mount
  useEffect(() => {
    const fetchInterpretation = async () => {
      setIsLoadingInterpretation(true)
      try {
        const response = await fetch('/statistics/interpretation')
        if (response.ok) {
          const data = await response.json()
          setInterpretation(data.interpretation)
        }
      } catch (error) {
        console.error('Failed to fetch interpretation:', error)
      } finally {
        setIsLoadingInterpretation(false)
      }
    }

    fetchInterpretation()
  }, [])

  useEffect(() => {
    const fetchEvolution = async () => {
      setIsLoadingEvolution(true)
      try {
        const response = await fetch(`/statistics/evolution?days=${selectedPeriod}&metric=missions_completed`)
        if (response.ok) {
          const data = await response.json()
          setEvolution(data.evolution || [])
        }
      } catch (error) {
        console.error('Failed to fetch evolution:', error)
      } finally {
        setIsLoadingEvolution(false)
      }
    }

    fetchEvolution()
  }, [selectedPeriod])

  return (
    <AppLayout currentPage="statistics">
      <Head title="Mes Statistiques - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mes Stats
          </h1>
          <p className="text-neutral-600 mt-1">
            Suivez votre progression !
          </p>
        </div>

        {/* AI Interpretation Card */}
        <Card className="mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-lg">AI</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="font-bold text-neutral-900">Analyse IA</h2>
                {interpretation ? (
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      interpretation.sentiment === 'positive'
                        ? 'bg-green-100 text-green-700'
                        : interpretation.sentiment === 'negative'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {interpretation.sentiment === 'positive'
                      ? 'Positif'
                      : interpretation.sentiment === 'negative'
                        ? 'À améliorer'
                        : 'Stable'}
                  </span>
                ) : !isLoadingInterpretation && instagram ? (
                  // Show "Bienvenue" badge when using fallback message
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                    Bienvenue
                  </span>
                ) : null}
              </div>
              {isLoadingInterpretation ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-neutral-500">Analyse en cours...</span>
                </div>
              ) : interpretation ? (
                <p className="text-neutral-700">{interpretation.text}</p>
              ) : instagram ? (
                // Fallback message when AI is not available but we have Instagram stats
                <p className="text-neutral-700">
                  Bienvenue ! Avec {(instagram.followers?.current ?? 0).toLocaleString('fr-FR')} abonnés et {(instagram.engagement?.impressions ?? 0).toLocaleString('fr-FR')} impressions,
                  tu as une belle base pour progresser ensemble.
                </p>
              ) : (
                <p className="text-neutral-500 text-sm">
                  Continuez à utiliser l'app pour obtenir une analyse personnalisée.
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {keyMetrics.map((metric) => (
            <Card key={metric.type} className="text-center">
              <span className="text-2xl block mb-1">{metric.icon}</span>
              <p className="text-2xl font-bold text-neutral-900">{metric.value}</p>
              <p className="text-xs text-neutral-500">{metric.label}</p>
            </Card>
          ))}
        </div>

        {/* Comparison card */}
        <Card className="mb-6 bg-primary/5 border-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-600">Cette semaine</p>
              <p className="text-2xl font-bold text-neutral-900">{comparison.current} missions</p>
            </div>
            <div className="text-right">
              {comparison.change >= 0 ? (
                <span className="text-green-600 font-bold">
                  +{comparison.changePercent}%
                </span>
              ) : (
                <span className="text-red-500 font-bold">
                  {comparison.changePercent}%
                </span>
              )}
              <p className="text-xs text-neutral-500">vs semaine passée</p>
            </div>
          </div>
        </Card>

        {/* Instagram Stats */}
        {instagram && (
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
                  </svg>
                </div>
                <h2 className="font-bold text-lg text-neutral-900">Instagram</h2>
              </div>
              <button
                onClick={refreshInstagramStats}
                disabled={isRefreshingInstagram}
                className="p-2 rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
                title="Actualiser les stats"
              >
                <svg
                  className={`w-5 h-5 text-neutral-600 ${isRefreshingInstagram ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            </div>

            {/* Followers */}
            <div className="bg-neutral-50 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Abonnés</p>
                  <p className="text-3xl font-bold text-neutral-900">
                    {(instagram.followers?.current ?? 0).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  {(instagram.followers?.growthWeekly ?? 0) >= 0 ? (
                    <span className="text-green-600 font-bold text-lg">
                      +{instagram.followers?.growthWeekly ?? 0}
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold text-lg">
                      {instagram.followers?.growthWeekly ?? 0}
                    </span>
                  )}
                  <p className="text-xs text-neutral-500">cette semaine</p>
                </div>
              </div>
            </div>

            {/* Engagement Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-neutral-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">
                  {(instagram.engagement?.impressions ?? 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-neutral-500">Impressions</p>
                {instagramComparison && (
                  <p className={`text-xs font-medium ${(instagramComparison.changes?.impressionsPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(instagramComparison.changes?.impressionsPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.impressionsPercent ?? 0}%
                  </p>
                )}
              </div>
              <div className="bg-neutral-50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-neutral-900">
                  {(instagram.engagement?.reach ?? 0).toLocaleString('fr-FR')}
                </p>
                <p className="text-xs text-neutral-500">Portée</p>
                {instagramComparison && (
                  <p className={`text-xs font-medium ${(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {(instagramComparison.changes?.reachPercent ?? 0) >= 0 ? '+' : ''}{instagramComparison.changes?.reachPercent ?? 0}%
                  </p>
                )}
              </div>
            </div>

            {/* Engagement Details */}
            <div className="grid grid-cols-4 gap-2 text-center mb-4">
              <div>
                <span className="text-lg block">❤️</span>
                <p className="font-bold text-sm">{(instagram.engagement?.likes ?? 0).toLocaleString('fr-FR')}</p>
                <p className="text-xs text-neutral-500">Likes</p>
              </div>
              <div>
                <span className="text-lg block">💬</span>
                <p className="font-bold text-sm">{(instagram.engagement?.comments ?? 0).toLocaleString('fr-FR')}</p>
                <p className="text-xs text-neutral-500">Commentaires</p>
              </div>
              <div>
                <span className="text-lg block">🔁</span>
                <p className="font-bold text-sm">{(instagram.engagement?.shares ?? 0).toLocaleString('fr-FR')}</p>
                <p className="text-xs text-neutral-500">Partages</p>
              </div>
              <div>
                <span className="text-lg block">🔖</span>
                <p className="font-bold text-sm">{(instagram.engagement?.saves ?? 0).toLocaleString('fr-FR')}</p>
                <p className="text-xs text-neutral-500">Saves</p>
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600">Taux d'engagement</p>
                  <p className="text-2xl font-bold text-neutral-900">
                    {Number(instagram.engagement?.averageRate ?? 0).toFixed(2)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-neutral-500">
                    {Number(instagram.engagement?.averageRate ?? 0) >= 3
                      ? '🔥 Excellent !'
                      : Number(instagram.engagement?.averageRate ?? 0) >= 1
                        ? '👍 Bon'
                        : '📈 À améliorer'}
                  </p>
                </div>
              </div>
            </div>

            {instagram.lastUpdated && (
              <p className="text-xs text-neutral-400 mt-3 text-center">
                Dernière mise à jour : {new Date(instagram.lastUpdated).toLocaleString('fr-FR')}
              </p>
            )}
          </Card>
        )}

        {/* Activity Summary */}
        <Card className="mb-6">
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Récapitulatif</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total missions</span>
              <span className="font-bold text-neutral-900">{summary.totalMissions}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total tutoriels</span>
              <span className="font-bold text-neutral-900">{summary.totalTutorials}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Total publications</span>
              <span className="font-bold text-neutral-900">{summary.totalPublications}</span>
            </div>
          </div>

          {/* Breakdown by type */}
          <div className="mt-6 pt-4 border-t border-neutral-100">
            <h3 className="text-sm font-medium text-neutral-600 mb-3">Par type</h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <span className="text-lg block">📸</span>
                <p className="font-bold text-sm">{summary.byType.posts}</p>
                <p className="text-xs text-neutral-500">Posts</p>
              </div>
              <div>
                <span className="text-lg block">📱</span>
                <p className="font-bold text-sm">{summary.byType.stories}</p>
                <p className="text-xs text-neutral-500">Stories</p>
              </div>
              <div>
                <span className="text-lg block">🎬</span>
                <p className="font-bold text-sm">{summary.byType.reels}</p>
                <p className="text-xs text-neutral-500">Réels</p>
              </div>
              <div>
                <span className="text-lg block">📚</span>
                <p className="font-bold text-sm">{summary.byType.tutos}</p>
                <p className="text-xs text-neutral-500">Tutos</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Period selector for charts */}
        <Card className="mb-6">
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Évolution</h2>

          <div className="flex gap-2 mb-4">
            {(['7', '30', '90'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? 'bg-primary text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}
              >
                {period}j
              </button>
            ))}
          </div>

          {/* Evolution data display */}
          <div className="bg-neutral-50 rounded-xl p-6 text-center">
            {isLoadingEvolution ? (
              <p className="text-neutral-500">Chargement...</p>
            ) : evolution.length > 0 ? (
              <div>
                <div className="flex justify-between items-end h-24 gap-1 mb-2">
                  {evolution.slice(-14).map((point, index) => {
                    const maxValue = Math.max(...evolution.map(p => p.value), 1)
                    const height = (point.value / maxValue) * 100
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-primary rounded-t"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${point.date}: ${point.value}`}
                      />
                    )
                  })}
                </div>
                <p className="text-neutral-600 text-sm">
                  {evolution.length} points sur {selectedPeriod} jours
                </p>
              </div>
            ) : (
              <>
                <span className="text-4xl mb-2 block">📈</span>
                <p className="text-neutral-600 text-sm">
                  Aucune donnée sur {selectedPeriod} jours
                </p>
                <p className="text-xs text-neutral-400 mt-2">
                  Continuez vos missions pour voir votre progression !
                </p>
              </>
            )}
          </div>
        </Card>

        {/* Motivation */}
        <Card className="text-center bg-primary/5 border-primary">
          <span className="text-4xl block mb-2">💪</span>
          <p className="font-bold text-primary">
            Chaque mission compte !
          </p>
          <Link href="/missions" className="text-sm text-primary underline mt-2 inline-block">
            Faire ma mission du jour →
          </Link>
        </Card>

      </div>
    </AppLayout>
  )
}
