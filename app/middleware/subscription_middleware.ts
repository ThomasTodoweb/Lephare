import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import StripeService from '#services/stripe_service'

/**
 * Subscription middleware ensures the user has an active subscription
 * (either paid or in trial period) before accessing premium features.
 */
export default class SubscriptionMiddleware {
  private stripeService = new StripeService()

  /**
   * The URL to redirect to when subscription is required
   */
  redirectTo = '/subscription'

  async handle(ctx: HttpContext, next: NextFn) {
    // User must be authenticated (handled by auth middleware before this)
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.redirect('/login')
    }

    // Check if user has active subscription
    const subscription = await this.stripeService.getSubscription(user.id)
    const isActive = subscription?.isActive() ?? false

    if (!isActive) {
      // For API requests, return 402 Payment Required
      if (ctx.request.accepts(['html', 'json']) === 'json') {
        return ctx.response.paymentRequired({
          error: 'Abonnement requis',
          message: 'Veuillez vous abonner pour accéder à cette fonctionnalité',
          subscriptionUrl: this.redirectTo,
        })
      }

      // For web requests, redirect to subscription page
      ctx.session.flash('warning', 'Veuillez vous abonner pour continuer')
      return ctx.response.redirect(this.redirectTo)
    }

    // Add subscription info to context for use in controllers/views
    ctx.subscription = subscription

    return next()
  }
}

// Extend HttpContext to include subscription
declare module '@adonisjs/core/http' {
  interface HttpContext {
    subscription?: import('#models/subscription').default | null
  }
}
