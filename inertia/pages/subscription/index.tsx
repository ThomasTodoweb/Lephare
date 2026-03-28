import { Head, Link, router } from '@inertiajs/react'
import { useState, useEffect, useRef } from 'react'
import { AppLayout } from '~/components/layout'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { ArrowLeft, Check, Download, Clock } from 'lucide-react'

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
  const abortControllerRef = useRef<AbortController | null>(null)

  // Load invoices when component mounts
  useEffect(() => {
    if (isActive || isCanceled) {
      loadInvoices()
    }

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [isActive, isCanceled])

  const loadInvoices = async () => {
    // Abort any previous request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setLoadingInvoices(true)
    try {
      const response = await fetch('/subscription/invoices', { signal })
      if (response.ok && !signal.aborted) {
        const data = await response.json()
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return // Request was aborted, ignore silently
      }
      console.error('Failed to load invoices:', error)
    } finally {
      if (!signal.aborted) {
        setLoadingInvoices(false)
      }
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
      alert('Le systeme de paiement n\'est pas encore configure.')
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
        alert(errorData.error || 'Une erreur est survenue lors de la creation du paiement.')
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
      alert('Une erreur est survenue. Reessaie.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Es-tu sur de vouloir annuler ton abonnement ?')) {
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
      alert('Une erreur est survenue. Reessaie.')
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
    <AppLayout>
      <Head title="Mon Abonnement - Le Phare" />

      <div className="py-4 animate-fade-up">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-[13px] text-text-secondary min-h-[44px] -ml-1 pl-1 pr-2"
          >
            <ArrowLeft size={15} />
            <span>Retour au profil</span>
          </Link>
          <h1 className="text-[22px] font-bold text-text tracking-tight">Mon abonnement</h1>
        </div>

        {/* Trial Banner */}
        {isTrialing && trialInfo && (
          <Card variant="bordered" className="mb-6 bg-warning-light">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <Clock size={18} className="text-warning" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-text">Periode d'essai</p>
                <p className="text-[13px] text-text-secondary leading-relaxed">
                  Il te reste <strong>{trialInfo.daysRemaining} jours</strong> d'essai gratuit
                </p>
                <p className="text-[12px] text-text-muted mt-0.5">
                  Se termine le {formatDate(trialInfo.endsAt)}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Current Subscription */}
        {(isActive || isCanceled) && subscription && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Ton abonnement
            </p>
            <Card variant="bordered" className="border border-border">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-text-secondary">Plan</span>
                  <span className="text-[14px] font-medium text-text">
                    {subscription.planType === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <span className="text-[13px] text-text-secondary">Statut</span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success' : 'bg-error'}`} />
                    <span className={`text-[14px] font-medium ${isActive ? 'text-success' : 'text-error'}`}>
                      {isActive ? 'Actif' : 'Annule'}
                    </span>
                  </span>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <span className="text-[13px] text-text-secondary">
                      {isActive ? 'Prochain renouvellement' : 'Acces jusqu\'au'}
                    </span>
                    <span className="text-[14px] font-medium text-text">{formatDate(subscription.currentPeriodEnd)}</span>
                  </div>
                )}
              </div>

              {isActive && (
                <div className="space-y-2 mt-5 pt-4 border-t border-border">
                  <Button
                    variant="secondary"
                    onClick={handleOpenBillingPortal}
                    loading={isOpeningPortal}
                    fullWidth
                  >
                    Gerer mon abonnement
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleCancel}
                    loading={isCanceling}
                    fullWidth
                    className="!text-error"
                  >
                    Annuler l'abonnement
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Invoices History */}
        {(isActive || isCanceled) && (
          <div className="mb-6">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
              Factures
            </p>
            <Card variant="bordered" className="border border-border">
              {loadingInvoices ? (
                <p className="text-[13px] text-text-muted">Chargement...</p>
              ) : invoices.length === 0 ? (
                <p className="text-[13px] text-text-muted">Aucune facture disponible</p>
              ) : (
                <div className="space-y-0">
                  {invoices.map((invoice, idx) => (
                    <div
                      key={invoice.id}
                      className={`flex items-center justify-between py-3 ${
                        idx > 0 ? 'border-t border-border' : ''
                      }`}
                    >
                      <div>
                        <p className="text-[14px] font-medium text-text">
                          {invoice.number || 'Facture'}
                        </p>
                        <p className="text-[12px] text-text-muted">
                          {new Date(invoice.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[14px] font-semibold text-text tabular-nums">
                          {invoice.amount}&euro;
                        </span>
                        {invoice.pdfUrl && (
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-11 h-11 flex items-center justify-center text-text-secondary active:scale-[0.97] transition-transform"
                          >
                            <Download size={15} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Pricing Plans */}
        {(!subscription || isTrialing || isCanceled) && (
          <>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-3 px-1">
              {isTrialing ? 'Choisis ton plan' : 'Nos offres'}
            </p>

            <div className="space-y-2.5 mb-6">
              {/* Monthly Plan */}
              <button
                onClick={() => setSelectedPlan('monthly')}
                className={`w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98] ${
                  selectedPlan === 'monthly'
                    ? 'border-2 border-text bg-bg-card border-2 border-primary/20'
                    : 'border border-border bg-bg-card'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[15px] font-semibold text-text">Mensuel</p>
                    <p className="text-[13px] text-text-muted leading-relaxed">Facturation chaque mois</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-bold text-text tabular-nums">
                      {pricing.monthly.price}&euro;
                    </p>
                    <p className="text-[12px] text-text-muted">/{pricing.monthly.interval}</p>
                  </div>
                </div>
              </button>

              {/* Yearly Plan */}
              <button
                onClick={() => setSelectedPlan('yearly')}
                className={`w-full p-4 rounded-2xl text-left transition-all active:scale-[0.98] relative ${
                  selectedPlan === 'yearly'
                    ? 'border-2 border-text bg-bg-card border-2 border-primary/20'
                    : 'border border-border bg-bg-card'
                }`}
              >
                <div className="absolute -top-2 right-4 bg-text text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  -{pricing.yearly.savings}&euro;
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[15px] font-semibold text-text">Annuel</p>
                    <p className="text-[13px] text-text-muted leading-relaxed">2 mois offerts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-bold text-text tabular-nums">
                      {pricing.yearly.price}&euro;
                    </p>
                    <p className="text-[12px] text-text-muted">/{pricing.yearly.interval}</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Subscribe Button */}
            <Button onClick={handleSubscribe} loading={isLoading} fullWidth>
              Rejoindre Le Phare - {selectedPlan === 'monthly' ? pricing.monthly.price : pricing.yearly.price}&euro;
            </Button>

            {!isConfigured && (
              <p className="text-[12px] text-warning text-center mt-2">
                Mode demo - Paiement non configure
              </p>
            )}
          </>
        )}

        {/* Features */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Inclus dans l'abonnement
          </p>
          <Card variant="bordered" className="border border-border">
            <ul className="space-y-3">
              {[
                'Missions quotidiennes personnalisees',
                'Acces a tous les tutoriels',
                'Statistiques detaillees',
                'Systeme de badges et de motivation',
                'Rappels quotidiens',
                'Support prioritaire',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <Check size={14} className="text-success flex-shrink-0" />
                  <span className="text-[14px] text-text">{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* FAQ */}
        <div className="mt-6">
          <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2 px-1">
            Questions frequentes
          </p>
          <Card variant="bordered" className="border border-border">
            <div className="space-y-4">
              <div>
                <p className="text-[14px] font-medium text-text">
                  Puis-je annuler a tout moment ?
                </p>
                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                  Oui, tu peux annuler ton abonnement quand tu le souhaites. Tu garderas l'acces jusqu'a la fin de la periode payee.
                </p>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-[14px] font-medium text-text">
                  Comment fonctionne la periode d'essai ?
                </p>
                <p className="text-[13px] text-text-secondary mt-1 leading-relaxed">
                  Tu beneficies de 7 jours d'essai gratuit pour decouvrir toutes les fonctionnalites de Le Phare.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
