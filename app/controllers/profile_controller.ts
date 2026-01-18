import type { HttpContext } from '@adonisjs/core/http'
import LaterService from '#services/later_service'
import GamificationService from '#services/gamification_service'
import StripeService from '#services/stripe_service'

export default class ProfileController {
  private gamificationService = new GamificationService()
  private stripeService = new StripeService()

  /**
   * Show user profile page
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')
    await user.load('instagramConnection')

    const restaurant = user.restaurant
    const instagramConnection = user.instagramConnection

    // Get streak info
    const streakInfo = await this.gamificationService.getStreakInfo(user.id)

    // Get subscription info
    const subscription = await this.stripeService.getSubscription(user.id)

    return inertia.render('profile/index', {
      user: {
        email: user.email,
        createdAt: user.createdAt?.toISO(),
      },
      restaurant: restaurant
        ? {
            name: restaurant.name,
            type: restaurant.type,
            publicationRhythm: restaurant.publicationRhythm,
          }
        : null,
      instagram: instagramConnection
        ? {
            username: instagramConnection.instagramUsername,
            connectedAt: instagramConnection.connectedAt?.toISO(),
          }
        : null,
      streak: {
        currentStreak: streakInfo.currentStreak,
        longestStreak: streakInfo.longestStreak,
      },
      subscription: subscription
        ? {
            planType: subscription.planType,
            status: subscription.status,
            trialDaysRemaining: subscription.isTrialing() ? subscription.trialDaysRemaining() : null,
          }
        : null,
    })
  }

  /**
   * Disconnect Instagram account
   */
  async disconnectInstagram({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const laterService = new LaterService()

    await laterService.deleteConnection(user.id)

    session.flash('success', 'Votre compte Instagram a été déconnecté.')

    return response.redirect().back()
  }

  /**
   * Initiate Instagram reconnection (redirect to OAuth)
   */
  async reconnectInstagram({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const laterService = new LaterService()

    if (!laterService.isConfigured()) {
      session.flash('error', 'La connexion Instagram n\'est pas encore disponible.')
      return response.redirect().back()
    }

    // Delete existing connection
    await laterService.deleteConnection(user.id)

    // Store state for OAuth callback
    const state = `${user.id}-${Date.now()}`
    session.put('later_oauth_state', state)

    // Redirect to Later OAuth
    const authUrl = laterService.getAuthorizationUrl(state)
    return response.redirect(authUrl)
  }
}
