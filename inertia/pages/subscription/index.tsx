import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import { AppLayout } from '~/components/layout'
import { Button, Card } from '~/components/ui'

interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string
  date: string
  pdfUrl: string | null
}

interface Pricing {
  monthly: {
    price: number
    currency: string
    interval: string
  }
  yearly: {
    price: number
    currency: string
    interval: string
    savings: number
  }
}

interface Props {
  subscription: {
    planType: string
    status: string
    currentPeriodEnd: string | null
    canceledAt: string | null
  } | null
  trialInfo: {
    daysRemaining: number
    endsAt: string
  } | null
  pricing: Pricing
  isConfigured: boolean
}

export default function SubscriptionIndex({ subscription, trialInfo, pricing, isConfigured }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly')
  const [isLoading, setIsLoading] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [isOpeningPortal, setIsOpeningPortal] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loadingInvoices, setLoadingInvoices] = useState(false)

  const isActive = subscription?.status === 'active'
  const isTrialing = subscription?.status === 'trialing'
  const isCanceled = subscription?.status === 'canceled'

  // Load invoices when component mounts
  useEffect(() => {
    if (isActive || isCanceled) {
      loadInvoices()
    }
  }, [isActive, isCanceled])

  const loadInvoices = async () => {
    setLoadingInvoices(true)
    try {
      const response = await fetch('/subscription/invoices')
      if (response.ok) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      setLoadingInvoices(false)
    }
  }

  const handleOpenBillingPortal = async () => {
    setIsOpeningPortal(true)
    try {
      const response = await fetch('/subscription/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken() || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        }
      } else {
        alert('Impossible d\'ouvrir le portail de facturation.')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Une erreur est survenue.')
    } finally {
      setIsOpeningPortal(false)
    }
  }

  const handleSubscribe = async () => {
    if (!isConfigured) {
      alert('Le système de paiement n\'est pas encore configuré.')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken() || '',
        },
        body: JSON.stringify({ planType: selectedPlan }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Une erreur est survenue lors de la création du paiement.')
        return
      }

      const data = await response.json()
      // In production, redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        router.visit('/subscription/success?demo=true')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
      return
    }

    setIsCanceling(true)
    try {
      const response = await fetch('/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': getXsrfToken() || '',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        alert(errorData.error || 'Une erreur est survenue lors de l\'annulation.')
        return
      }

      router.reload()
    } catch (error) {
      console.error('Cancel error:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsCanceling(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <AppLayout currentPage="profile">
      <Head title="Mon Abonnement - Le Phare" />

      <div className="py-4">
        {/* Header */}
        <div className="mb-6">
          <Link href="/profile" className="text-primary text-sm mb-2 inline-block">
            ← Retour au profil
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
            Mon Abonnement
          </h1>
        </div>

        {/* Trial Banner */}
        {isTrialing && trialInfo && (
          <Card className="mb-6 bg-primary/10 border-primary">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⏳</span>
              <div>
                <p className="font-bold text-primary">Période d'essai</p>
                <p className="text-sm text-neutral-600">
                  Il vous reste <strong>{trialInfo.daysRemaining} jours</strong> d'essai gratuit
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Se termine le {formatDate(trialInfo.endsAt)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Subscription */}
        {(isActive || isCanceled) && subscription && (
          <Card className="mb-6">
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Votre abonnement</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Plan</span>
                <span className="font-bold">
                  {subscription.planType === 'monthly' ? 'Mensuel' : 'Annuel'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Statut</span>
                <span
                  className={`font-bold ${isActive ? 'text-green-600' : 'text-red-500'}`}
                >
                  {isActive ? 'Actif' : 'Annulé'}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-600">
                    {isActive ? 'Prochain renouvellement' : 'Accès jusqu\'au'}
                  </span>
                  <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
              )}
            </div>

            {isActive && (
              <div className="space-y-2 mt-4">
                <Button
                  variant="outlined"
                  onClick={handleOpenBillingPortal}
                  disabled={isOpeningPortal}
                  className="w-full"
                >
                  {isOpeningPortal ? 'Chargement...' : 'Gérer mon abonnement'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isCanceling}
                  className="w-full !border-red-500 !text-red-500"
                >
                  {isCanceling ? 'Annulation...' : 'Annuler l\'abonnement'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* Invoices History */}
        {(isActive || isCanceled) && (
          <Card className="mb-6">
            <h2 className="font-bold text-lg text-neutral-900 mb-4">Historique des factures</h2>
            {loadingInvoices ? (
              <p className="text-neutral-500 text-sm">Chargement...</p>
            ) : invoices.length === 0 ? (
              <p className="text-neutral-500 text-sm">Aucune facture disponible</p>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {invoice.number || 'Facture'}
                      </p>
                      <p className="text-sm text-neutral-500">
                        {new Date(invoice.date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-neutral-900">
                        {invoice.amount}€
                      </span>
                      {invoice.pdfUrl && (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary text-sm hover:underline"
                        >
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Pricing Plans */}
        {(!subscription || isTrialing || isCanceled) && (
          <>
            <h2 className="font-bold text-lg text-neutral-900 mb-4">
              {isTrialing ? 'Choisissez votre plan' : 'Nos offres'}
            </h2>

            <div className="space-y-3 mb-6">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedPlan === 'monthly'
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-neutral-900">Mensuel</p>
                    <p className="text-sm text-neutral-500">Facturation chaque mois</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      {pricing.monthly.price}€
                    </p>
                    <p className="text-sm text-neutral-500">/{pricing.monthly.interval}</p>
                  </div>
                </div>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                  selectedPlan === 'yearly'
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                <div className="absolute -top-2 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{pricing.yearly.savings}€
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-neutral-900">Annuel</p>
                    <p className="text-sm text-neutral-500">2 mois offerts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neutral-900">
                      {pricing.yearly.price}€
                    </p>
                    <p className="text-sm text-neutral-500">/{pricing.yearly.interval}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Subscribe Button */}
            <Button onClick={handleSubscribe} disabled={isLoading} className="w-full">
              {isLoading ? 'Chargement...' : `S'abonner - ${selectedPlan === 'monthly' ? pricing.monthly.price : pricing.yearly.price}€`}
            </Button>

            {!isConfigured && (
              <p className="text-xs text-amber-600 text-center mt-2">
                Mode démo - Paiement non configuré
              </p>
            )}
          </>
        )}

        {/* Features */}
        <Card className="mt-6">
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Inclus dans l'abonnement</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Missions quotidiennes personnalisées</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Accès à tous les tutoriels</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Statistiques détaillées</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Système de badges et gamification</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Rappels quotidiens</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-green-500">✓</span>
              <span className="text-neutral-700">Support prioritaire</span>
            </li>
          </ul>
        </Card>

        {/* FAQ */}
        <Card className="mt-6">
          <h2 className="font-bold text-lg text-neutral-900 mb-4">Questions fréquentes</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-neutral-900">
                Puis-je annuler à tout moment ?
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                Oui, vous pouvez annuler votre abonnement quand vous le souhaitez. Vous garderez l'accès jusqu'à la fin de la période payée.
              </p>
            </div>
            <div>
              <p className="font-medium text-neutral-900">
                Comment fonctionne la période d'essai ?
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                Vous bénéficiez de 7 jours d'essai gratuit pour découvrir toutes les fonctionnalités de Le Phare.
              </p>
            </div>
          </div>
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

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
