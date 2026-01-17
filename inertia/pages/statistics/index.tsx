import { Head, Link } from '@inertiajs/react'
import { useState } from 'react'
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

interface Props {
  keyMetrics: KeyMetric[]
  summary: Summary
  comparison: Comparison
}

export default function StatisticsIndex({ keyMetrics, summary, comparison }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30')

  return (
    <AppLayout currentPage="profile">
      <Head title="Mes Statistiques - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="text-primary text-sm mb-2 inline-block">
            ← Retour au profil
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mes Stats
          </h1>
          <p className="text-neutral-600 mt-1">
            Suivez votre progression !
          </p>
        </div>

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

          {/* Placeholder for chart */}
          <div className="bg-neutral-50 rounded-xl p-6 text-center">
            <span className="text-4xl mb-2 block">📈</span>
            <p className="text-neutral-600 text-sm">
              Graphique d'évolution sur {selectedPeriod} jours
            </p>
            <p className="text-xs text-neutral-400 mt-2">
              Continuez vos missions pour voir votre progression !
            </p>
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

        {/* Chef illustration */}
        <div className="flex justify-center mt-8">
          <div className="w-24 h-24 bg-neutral-100 rounded-full flex items-center justify-center">
            <span className="text-5xl">👨‍🍳</span>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
