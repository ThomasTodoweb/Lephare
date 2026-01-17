import type { HttpContext } from '@adonisjs/core/http'
import StripeService from '#services/stripe_service'

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
   */
  async success({ inertia, request }: HttpContext) {
    const sessionId = request.input('session_id')

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
   * Handle Stripe webhook
   * In production, this should verify the Stripe signature
   */
  async webhook({ request, response }: HttpContext) {
    const body = request.body()
    const signature = request.header('stripe-signature')

    // In production, verify the webhook signature
    // const webhookSecret = env.get('STRIPE_WEBHOOK_SECRET')
    // if (webhookSecret && signature) {
    //   try {
    //     const stripe = require('stripe')(env.get('STRIPE_SECRET_KEY'))
    //     const event = stripe.webhooks.constructEvent(request.raw(), signature, webhookSecret)
    //     await this.stripeService.handleWebhook(event)
    //     return response.json({ received: true })
    //   } catch (err) {
    //     console.error('Webhook signature verification failed:', err)
    //     return response.badRequest({ error: 'Invalid signature' })
    //   }
    // }

    // Development mode: accept without signature (with warning)
    if (!signature) {
      console.warn('⚠️ Webhook received without signature - OK in dev, MUST be fixed in production')
    }

    // Validate webhook event structure
    if (!body.type || !body.data) {
      return response.badRequest({ error: 'Invalid webhook payload' })
    }

    const event = {
      type: body.type as string,
      data: body.data as { object: Record<string, unknown> },
    }

    try {
      await this.stripeService.handleWebhook(event)
      return response.json({ received: true })
    } catch (error) {
      console.error('Webhook error:', error)
      return response.badRequest({ error: 'Webhook processing failed' })
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
}
