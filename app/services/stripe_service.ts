import env from '#start/env'
import Stripe from 'stripe'
import Subscription from '#models/subscription'
import User from '#models/user'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

interface CreateCheckoutResult {
  sessionId: string
  checkoutUrl: string
}

export default class StripeService {
  private stripe: Stripe | null = null
  private publishableKey: string | undefined
  private monthlyPriceId: string | undefined
  private yearlyPriceId: string | undefined

  constructor() {
    const secretKey = env.get('STRIPE_SECRET_KEY')
    this.publishableKey = env.get('STRIPE_PUBLISHABLE_KEY')
    this.monthlyPriceId = env.get('STRIPE_PRICE_MONTHLY')
    this.yearlyPriceId = env.get('STRIPE_PRICE_YEARLY')

    if (secretKey) {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2025-12-15.clover',
        typescript: true,
      })
    }
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!(this.stripe && this.publishableKey)
  }

  /**
   * Get publishable key for frontend
   */
  getPublishableKey(): string | null {
    return this.publishableKey || null
  }

  /**
   * Get webhook secret for signature verification
   */
  getWebhookSecret(): string | null {
    return env.get('STRIPE_WEBHOOK_SECRET') || null
  }

  /**
   * Construct webhook event with signature verification
   */
  constructWebhookEvent(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.getWebhookSecret()
    if (!this.stripe || !webhookSecret) {
      throw new Error('Stripe not configured or webhook secret missing')
    }
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user: User): Promise<string | null> {
    if (!this.stripe) {
      logger.warn('StripeService: Not configured, skipping customer creation')
      return null
    }

    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.fullName || undefined,
        metadata: { userId: user.id.toString() },
      })
      logger.info({ userId: user.id, customerId: customer.id }, 'Stripe customer created')
      return customer.id
    } catch (error) {
      logger.error({ error, userId: user.id }, 'Failed to create Stripe customer')
      return null
    }
  }

  /**
   * Create a checkout session for subscription
   * Uses database transaction to prevent race conditions
   */
  async createCheckoutSession(
    userId: number,
    planType: 'monthly' | 'yearly',
    successUrl: string,
    cancelUrl: string
  ): Promise<CreateCheckoutResult | null> {
    if (!this.stripe) {
      logger.warn('StripeService: Not configured')
      return null
    }

    const priceId = planType === 'monthly' ? this.monthlyPriceId : this.yearlyPriceId
    if (!priceId) {
      logger.error({ planType }, 'Stripe price ID not configured')
      return null
    }

    const user = await User.find(userId)
    if (!user) return null

    try {
      // Use transaction with row locking to prevent race conditions
      return await db.transaction(async (trx) => {
        // Get or create subscription with row lock (FOR UPDATE)
        let subscription = await Subscription.query({ client: trx })
          .where('user_id', userId)
          .forUpdate()
          .first()

        let customerId = subscription?.stripeCustomerId

        if (!customerId) {
          // Create Stripe customer
          customerId = await this.createCustomer(user)
          if (!customerId) {
            throw new Error('Failed to create Stripe customer')
          }

          // Store customer ID in subscription (or create new subscription record)
          if (subscription) {
            subscription.stripeCustomerId = customerId
            subscription.useTransaction(trx)
            await subscription.save()
          } else {
            // Create subscription record with customer ID
            subscription = await Subscription.create(
              {
                userId,
                stripeCustomerId: customerId,
                planType: 'free_trial',
                status: 'incomplete',
              },
              { client: trx }
            )
          }
        }

        const session = await this.stripe!.checkout.sessions.create({
          customer: customerId,
          mode: 'subscription',
          line_items: [{ price: priceId, quantity: 1 }],
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: { userId: userId.toString(), planType },
          subscription_data: {
            metadata: { userId: userId.toString(), planType },
          },
        })

        logger.info({ userId, sessionId: session.id }, 'Stripe checkout session created')
        return {
          sessionId: session.id,
          checkoutUrl: session.url || '',
        }
      })
    } catch (error) {
      logger.error({ error, userId }, 'Failed to create Stripe checkout session')
      return null
    }
  }

  /**
   * Create or update subscription in database
   */
  async createOrUpdateSubscription(
    userId: number,
    data: {
      stripeCustomerId?: string
      stripeSubscriptionId?: string
      stripePriceId?: string
      planType?: 'free_trial' | 'monthly' | 'yearly'
      status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'
      currentPeriodStart?: DateTime
      currentPeriodEnd?: DateTime
      trialEndsAt?: DateTime
    }
  ): Promise<Subscription> {
    const subscription = await Subscription.updateOrCreate({ userId }, { ...data })
    return subscription
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(userId: number): Promise<boolean> {
    const subscription = await Subscription.query().where('user_id', userId).first()

    if (!subscription) {
      return false
    }

    // If there's a Stripe subscription, cancel it via API
    if (subscription.stripeSubscriptionId && this.stripe) {
      try {
        await this.stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
        logger.info({ userId, subscriptionId: subscription.stripeSubscriptionId }, 'Stripe subscription canceled')
      } catch (error) {
        logger.error({ error, userId }, 'Failed to cancel Stripe subscription')
        // Continue to update local status even if Stripe call fails
      }
    }

    // Update local subscription status
    subscription.status = 'canceled'
    subscription.canceledAt = DateTime.utc()
    await subscription.save()

    logger.info({ userId }, 'Subscription canceled locally')
    return true
  }

  /**
   * Get subscription info for a user
   */
  async getSubscription(userId: number): Promise<Subscription | null> {
    return Subscription.query().where('user_id', userId).first()
  }

  /**
   * Handle Stripe webhook event (already verified)
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    logger.info({ eventType: event.type, eventId: event.id }, 'Processing Stripe webhook')

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'invoice.paid':
        await this.handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
      default:
        logger.debug({ eventType: event.type }, 'Unhandled Stripe event type')
    }
  }

  private async handleCheckoutComplete(session: Stripe.Checkout.Session): Promise<void> {
    logger.info({ sessionId: session.id, metadata: session.metadata }, 'Processing checkout.session.completed webhook')

    const userId = Number(session.metadata?.userId)
    if (!userId) {
      logger.error({ sessionId: session.id }, 'No userId in checkout session metadata')
      return
    }

    const planType = session.metadata?.planType as 'monthly' | 'yearly' || 'monthly'

    const subscription = await this.createOrUpdateSubscription(userId, {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: session.subscription as string,
      status: 'active',
      planType,
      currentPeriodStart: DateTime.utc(),
      currentPeriodEnd: DateTime.utc().plus({ months: planType === 'yearly' ? 12 : 1 }),
    })

    logger.info({ userId, planType, subscriptionId: subscription.id, status: subscription.status }, 'Subscription activated from checkout webhook')
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await Subscription.query()
      .where('stripe_subscription_id', stripeSubscription.id)
      .first()

    if (!subscription) {
      logger.warn({ subscriptionId: stripeSubscription.id }, 'Local subscription not found for Stripe subscription')
      return
    }

    subscription.status = this.mapStripeStatus(stripeSubscription.status)

    // Use start_date and calculate period end from billing_cycle_anchor or items
    if (stripeSubscription.start_date) {
      subscription.currentPeriodStart = DateTime.fromSeconds(stripeSubscription.start_date)
    }

    // Calculate period end based on billing cycle anchor
    if (stripeSubscription.billing_cycle_anchor) {
      // Period end is typically the next billing cycle
      subscription.currentPeriodEnd = DateTime.fromSeconds(stripeSubscription.billing_cycle_anchor)
    }

    if (stripeSubscription.trial_end) {
      subscription.trialEndsAt = DateTime.fromSeconds(stripeSubscription.trial_end)
    }
    await subscription.save()

    logger.info({ subscriptionId: subscription.id, status: subscription.status }, 'Subscription updated from webhook')
  }

  private async handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
    const subscription = await Subscription.query()
      .where('stripe_subscription_id', stripeSubscription.id)
      .first()

    if (subscription) {
      subscription.status = 'canceled'
      subscription.canceledAt = DateTime.utc()
      await subscription.save()
      logger.info({ subscriptionId: subscription.id }, 'Subscription deleted from webhook')
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    // Get subscription ID from parent.subscription_details.subscription
    const subscriptionId = this.getSubscriptionIdFromInvoice(invoice)
    if (!subscriptionId) return

    const subscription = await Subscription.query()
      .where('stripe_subscription_id', subscriptionId)
      .first()

    if (subscription) {
      subscription.status = 'past_due'
      await subscription.save()
      logger.warn({ subscriptionId: subscription.id }, 'Subscription payment failed')
    }
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    // Get subscription ID from parent.subscription_details.subscription
    const subscriptionId = this.getSubscriptionIdFromInvoice(invoice)
    if (!subscriptionId) return

    const subscription = await Subscription.query()
      .where('stripe_subscription_id', subscriptionId)
      .first()

    if (subscription && subscription.status === 'past_due') {
      subscription.status = 'active'
      await subscription.save()
      logger.info({ subscriptionId: subscription.id }, 'Subscription reactivated after payment')
    }
  }

  /**
   * Extract subscription ID from invoice (handles both old and new API structure)
   */
  private getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
    // New API structure: parent.subscription_details.subscription
    const subscriptionDetails = invoice.parent?.subscription_details
    if (subscriptionDetails?.subscription) {
      const sub = subscriptionDetails.subscription
      return typeof sub === 'string' ? sub : sub.id
    }
    return null
  }

  private mapStripeStatus(
    stripeStatus: Stripe.Subscription.Status
  ): 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' {
    const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'> = {
      active: 'active',
      canceled: 'canceled',
      past_due: 'past_due',
      incomplete: 'incomplete',
      incomplete_expired: 'canceled',
      trialing: 'trialing',
      unpaid: 'past_due',
      paused: 'incomplete',
    }
    return statusMap[stripeStatus] || 'incomplete'
  }

  /**
   * Create a free trial subscription for new user
   */
  async createTrialSubscription(userId: number, trialDays: number = 7): Promise<Subscription> {
    const trialEndsAt = DateTime.utc().plus({ days: trialDays })

    return this.createOrUpdateSubscription(userId, {
      planType: 'free_trial',
      status: 'trialing',
      trialEndsAt,
      currentPeriodStart: DateTime.utc(),
      currentPeriodEnd: trialEndsAt,
    })
  }

  /**
   * Check if user has active subscription (including trial)
   */
  async hasActiveSubscription(userId: number): Promise<boolean> {
    const subscription = await this.getSubscription(userId)
    if (!subscription) return false
    return subscription.isActive()
  }

  /**
   * Get invoices history for a user
   */
  async getInvoices(userId: number, limit: number = 10): Promise<Array<{
    id: string
    number: string | null
    amount: number
    currency: string
    status: string
    date: string
    pdfUrl: string | null
  }>> {
    if (!this.stripe) {
      return []
    }

    const subscription = await this.getSubscription(userId)
    if (!subscription?.stripeCustomerId) {
      return []
    }

    try {
      const invoices = await this.stripe.invoices.list({
        customer: subscription.stripeCustomerId,
        limit,
      })

      return invoices.data.map((invoice) => ({
        id: invoice.id,
        number: invoice.number,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency.toUpperCase(),
        status: invoice.status || 'unknown',
        date: new Date(invoice.created * 1000).toISOString(),
        pdfUrl: invoice.invoice_pdf ?? null,
      }))
    } catch (error) {
      logger.error({ error, userId }, 'Failed to fetch invoices')
      return []
    }
  }

  /**
   * Sync subscription from Stripe checkout session
   * This is called on the success page to ensure the subscription is activated
   * even if the webhook hasn't processed yet
   */
  async syncFromCheckoutSession(sessionId: string, userId: number): Promise<Subscription | null> {
    if (!this.stripe) {
      logger.warn('StripeService: Not configured')
      return null
    }

    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription'],
      })

      // Verify this session belongs to the user
      const sessionUserId = Number(session.metadata?.userId)
      if (sessionUserId !== userId) {
        logger.warn({ sessionId, userId, sessionUserId }, 'User ID mismatch in checkout session')
        return null
      }

      // If session is not completed, nothing to do
      if (session.status !== 'complete') {
        logger.info({ sessionId, status: session.status }, 'Checkout session not complete')
        return null
      }

      const stripeSubscription = session.subscription as Stripe.Subscription | null
      if (!stripeSubscription) {
        logger.warn({ sessionId }, 'No subscription in checkout session')
        return null
      }

      const planType = session.metadata?.planType as 'monthly' | 'yearly' || 'monthly'

      // Update or create subscription record
      const subscription = await this.createOrUpdateSubscription(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: typeof stripeSubscription === 'string' ? stripeSubscription : stripeSubscription.id,
        status: 'active',
        planType,
        currentPeriodStart: DateTime.utc(),
        currentPeriodEnd: DateTime.utc().plus({ months: planType === 'yearly' ? 12 : 1 }),
      })

      logger.info({ userId, planType, sessionId }, 'Subscription synced from checkout session')
      return subscription
    } catch (error) {
      logger.error({ error, sessionId, userId }, 'Failed to sync subscription from checkout session')
      return null
    }
  }

  /**
   * Create Stripe billing portal session for self-service management
   */
  async createBillingPortalSession(userId: number, returnUrl: string): Promise<string | null> {
    if (!this.stripe) {
      logger.warn('StripeService: Not configured')
      return null
    }

    const subscription = await this.getSubscription(userId)
    if (!subscription?.stripeCustomerId) {
      logger.warn({ userId }, 'No Stripe customer ID for user')
      return null
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: returnUrl,
      })
      return session.url
    } catch (error) {
      logger.error({ error, userId }, 'Failed to create billing portal session')
      return null
    }
  }
}
