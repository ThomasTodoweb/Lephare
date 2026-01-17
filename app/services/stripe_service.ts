import env from '#start/env'
import Subscription from '#models/subscription'
import User from '#models/user'
import { DateTime } from 'luxon'

interface CreateCheckoutResult {
  sessionId: string
  checkoutUrl: string
}

interface StripeWebhookEvent {
  type: string
  data: {
    object: Record<string, unknown>
  }
}

export default class StripeService {
  private secretKey: string | undefined
  private publishableKey: string | undefined

  constructor() {
    this.secretKey = env.get('STRIPE_SECRET_KEY')
    this.publishableKey = env.get('STRIPE_PUBLISHABLE_KEY')
  }

  /**
   * Check if Stripe is configured
   */
  isConfigured(): boolean {
    return !!(this.secretKey && this.publishableKey)
  }

  /**
   * Get publishable key for frontend
   */
  getPublishableKey(): string | null {
    return this.publishableKey || null
  }

  /**
   * Create a Stripe customer for a user
   */
  async createCustomer(user: User): Promise<string | null> {
    if (!this.isConfigured()) {
      console.log('StripeService: Not configured')
      return null
    }

    // Placeholder: In production, use Stripe SDK
    // const stripe = require('stripe')(this.secretKey)
    // const customer = await stripe.customers.create({
    //   email: user.email,
    //   metadata: { userId: user.id.toString() },
    // })
    // return customer.id

    console.log('StripeService: Would create customer for user', user.id)
    return `cus_placeholder_${user.id}`
  }

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    userId: number,
    planType: 'monthly' | 'yearly',
    successUrl: string,
    _cancelUrl: string
  ): Promise<CreateCheckoutResult | null> {
    if (!this.isConfigured()) {
      console.log('StripeService: Not configured')
      return null
    }

    const user = await User.find(userId)
    if (!user) return null

    const subscription = await Subscription.query().where('user_id', userId).first()
    let customerId = subscription?.stripeCustomerId

    // Create customer if doesn't exist
    if (!customerId) {
      customerId = await this.createCustomer(user)
    }

    // Placeholder: In production, use Stripe SDK
    // const priceId = planType === 'monthly' ? this.monthlyPriceId : this.yearlyPriceId
    // const stripe = require('stripe')(this.secretKey)
    // const session = await stripe.checkout.sessions.create({
    //   customer: customerId,
    //   mode: 'subscription',
    //   line_items: [{ price: priceId, quantity: 1 }],
    //   success_url: successUrl,
    //   cancel_url: _cancelUrl,
    //   metadata: { userId: userId.toString() },
    // })
    // return { sessionId: session.id, checkoutUrl: session.url }

    console.log('StripeService: Would create checkout session for user', userId, planType)
    return {
      sessionId: `cs_placeholder_${userId}`,
      checkoutUrl: successUrl,
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
    const subscription = await Subscription.updateOrCreate(
      { userId },
      {
        ...data,
      }
    )

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
    if (subscription.stripeSubscriptionId) {
      // Placeholder: In production, use Stripe SDK
      // const stripe = require('stripe')(this.secretKey)
      // await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
      console.log('StripeService: Would cancel Stripe subscription for user', userId)
    }

    // Always allow canceling (including trials without Stripe subscription)
    subscription.status = 'canceled'
    subscription.canceledAt = DateTime.utc()
    await subscription.save()

    console.log('StripeService: Subscription canceled for user', userId)
    return true
  }

  /**
   * Get subscription info for a user
   */
  async getSubscription(userId: number): Promise<Subscription | null> {
    return Subscription.query().where('user_id', userId).first()
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhook(event: StripeWebhookEvent): Promise<void> {
    const eventType = event.type
    const data = event.data.object

    console.log('StripeService: Received webhook', eventType)

    switch (eventType) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(data)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(data)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(data)
        break
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(data)
        break
      default:
        console.log('StripeService: Unhandled event type', eventType)
    }
  }

  private async handleCheckoutComplete(data: Record<string, unknown>): Promise<void> {
    const metadata = data.metadata as Record<string, unknown> | undefined
    const userId = Number(metadata?.userId || data.client_reference_id)
    if (!userId) return

    await this.createOrUpdateSubscription(userId, {
      stripeCustomerId: data.customer as string,
      stripeSubscriptionId: data.subscription as string,
      status: 'active',
      planType: 'monthly',
      currentPeriodStart: DateTime.utc(),
      currentPeriodEnd: DateTime.utc().plus({ months: 1 }),
    })
  }

  private async handleSubscriptionUpdated(data: Record<string, unknown>): Promise<void> {
    const subscription = await Subscription.query()
      .where('stripe_subscription_id', data.id as string)
      .first()

    if (!subscription) return

    subscription.status = this.mapStripeStatus(data.status as string)
    if (data.current_period_end) {
      subscription.currentPeriodEnd = DateTime.fromSeconds(data.current_period_end as number)
    }
    await subscription.save()
  }

  private async handleSubscriptionDeleted(data: Record<string, unknown>): Promise<void> {
    const subscription = await Subscription.query()
      .where('stripe_subscription_id', data.id as string)
      .first()

    if (subscription) {
      subscription.status = 'canceled'
      subscription.canceledAt = DateTime.utc()
      await subscription.save()
    }
  }

  private async handlePaymentFailed(data: Record<string, unknown>): Promise<void> {
    const subscription = await Subscription.query()
      .where('stripe_subscription_id', data.subscription as string)
      .first()

    if (subscription) {
      subscription.status = 'past_due'
      await subscription.save()
    }
  }

  private mapStripeStatus(
    stripeStatus: string
  ): 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing' {
    const statusMap: Record<string, 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'> = {
      active: 'active',
      canceled: 'canceled',
      past_due: 'past_due',
      incomplete: 'incomplete',
      trialing: 'trialing',
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
}
