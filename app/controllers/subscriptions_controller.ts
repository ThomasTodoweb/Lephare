import type { HttpContext } from '@adonisjs/core/http'
import StripeService from '#services/stripe_service'
import logger from '@adonisjs/core/services/logger'

export default class SubscriptionsController {
  private stripeService = new StripeService()

  /**
   * Display subscription management page
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const subscription = await this.stripeService.getSubscription(user.id)

    // Calculate trial info if in trial
    let trialInfo = null
    if (subscription?.isTrialing()) {
      trialInfo = {
        daysRemaining: subscription.trialDaysRemaining(),
        endsAt: subscription.trialEndsAt?.toISO(),
      }
    }

    // Get pricing info
    const pricing = {
      monthly: {
        price: 29,
        currency: 'EUR',
        interval: 'mois',
      },
      yearly: {
        price: 290,
        currency: 'EUR',
        interval: 'an',
        savings: 58, // 2 mois gratuits
      },
    }

    return inertia.render('subscription/index', {
      subscription: subscription
        ? {
            planType: subscription.planType,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd?.toISO(),
            canceledAt: subscription.canceledAt?.toISO(),
          }
        : null,
      trialInfo,
      pricing,
      isConfigured: this.stripeService.isConfigured(),
    })
  }

  /**
   * Create checkout session for subscription
   */
  async createCheckout({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { planType } = request.only(['planType'])

    if (!['monthly', 'yearly'].includes(planType)) {
      return response.badRequest({ error: 'Invalid plan type' })
    }

    const baseUrl = request.header('origin') || 'http://localhost:3333'
    const successUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/subscription`

    const result = await this.stripeService.createCheckoutSession(
      user.id,
      planType as 'monthly' | 'yearly',
      successUrl,
      cancelUrl
    )

    if (!result) {
      return response.internalServerError({ error: 'Failed to create checkout session' })
    }

    return response.json({
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
    })
  }

  /**
   * Handle successful checkout
   * Syncs the subscription from Stripe to ensure it's active before showing success
   */
  async success({ inertia, request, auth }: HttpContext) {
    const sessionId = request.input('session_id')
    const user = auth.getUserOrFail()

    // Sync subscription from Stripe checkout session
    // This ensures the subscription is activated even if webhook hasn't processed yet
    if (sessionId) {
      await this.stripeService.syncFromCheckoutSession(sessionId, user.id)
    }

    return inertia.render('subscription/success', {
      sessionId,
    })
  }

  /**
   * Cancel subscription
   */
  async cancel({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const success = await this.stripeService.cancelSubscription(user.id)

    if (!success) {
      return response.badRequest({ error: 'No active subscription to cancel' })
    }

    return response.json({ success: true })
  }

  /**
   * Create billing portal session for self-service management
   */
  async billingPortal({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const baseUrl = request.header('origin') || 'http://localhost:3333'
    const returnUrl = `${baseUrl}/subscription`

    const portalUrl = await this.stripeService.createBillingPortalSession(user.id, returnUrl)

    if (!portalUrl) {
      return response.badRequest({ error: 'Unable to create billing portal session' })
    }

    return response.json({ url: portalUrl })
  }

  /**
   * Handle Stripe webhook with signature verification
   * Route must use rawBody middleware to capture body before bodyparser
   */
  async webhook({ request, response }: HttpContext) {
    const signature = request.header('stripe-signature')
    const webhookSecret = this.stripeService.getWebhookSecret()

    // Verify we have the webhook secret configured
    if (!webhookSecret) {
      logger.error('STRIPE_WEBHOOK_SECRET not configured')
      return response.internalServerError({ error: 'Webhook not configured' })
    }

    // Verify signature is present
    if (!signature) {
      logger.warn('Webhook received without signature')
      return response.badRequest({ error: 'Missing stripe-signature header' })
    }

    try {
      // Get raw body captured by rawBody middleware
      // @ts-expect-error - Custom property added by middleware
      const rawBody: Buffer | undefined = request.rawBody

      // Fallback to request.raw() if middleware not applied
      const body = rawBody || request.raw()

      if (!body) {
        logger.error('Could not get raw request body - ensure rawBody middleware is applied')
        return response.badRequest({ error: 'Invalid request body' })
      }

      // Verify and construct the event
      const event = this.stripeService.constructWebhookEvent(body, signature)

      // Process the webhook
      await this.stripeService.handleWebhook(event)

      return response.json({ received: true })
    } catch (error) {
      logger.error({ error }, 'Webhook signature verification failed')
      return response.badRequest({ error: 'Invalid signature' })
    }
  }

  /**
   * Get publishable key for frontend
   */
  async publicKey({ response }: HttpContext) {
    const key = this.stripeService.getPublishableKey()

    if (!key) {
      return response.json({ key: null, configured: false })
    }

    return response.json({ key, configured: true })
  }

  /**
   * Get invoices history
   */
  async invoices({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const invoices = await this.stripeService.getInvoices(user.id)

    return response.json({ invoices })
  }
}
