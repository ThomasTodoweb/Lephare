import type { HttpContext } from '@adonisjs/core/http'
import LateService from '#services/late_service'
import GamificationService from '#services/gamification_service'
import StripeService from '#services/stripe_service'
import Strategy from '#models/strategy'

export default class ProfileController {
  private gamificationService = new GamificationService()
  private stripeService = new StripeService()
  private lateService = new LateService()

  /**
   * Show user profile page
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant

    // Get Instagram account from Late API (not local table)
    let instagramAccount = null
    if (this.lateService.isConfigured()) {
      instagramAccount = await this.lateService.getInstagramAccountForUser(user.id)
    }

    // Get streak info
    const streakInfo = await this.gamificationService.getStreakInfo(user.id)

    // Get subscription info
    const subscription = await this.stripeService.getSubscription(user.id)

    // Get strategy info if restaurant has one
    let strategy = null
    if (restaurant?.strategyId) {
      strategy = await Strategy.find(restaurant.strategyId)
    }

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
            onboardingCompleted: restaurant.onboardingCompleted,
          }
        : null,
      strategy: strategy
        ? {
            id: strategy.id,
            name: strategy.name,
            icon: strategy.icon,
          }
        : null,
      instagram: instagramAccount
        ? {
            username: instagramAccount.username,
            profilePictureUrl: instagramAccount.profilePictureUrl,
            status: instagramAccount.status,
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
   * Disconnect Instagram account via Late API
   */
  async disconnectInstagram({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const success = await this.lateService.disconnectInstagram(user.id)

    if (success) {
      session.flash('success', 'Votre compte Instagram a été déconnecté.')
    } else {
      session.flash('error', 'Erreur lors de la déconnexion Instagram.')
    }

    return response.redirect().back()
  }

  /**
   * Redirect to Late dashboard to manage Instagram connection
   */
  async reconnectInstagram({ response, session }: HttpContext) {
    if (!this.lateService.isConfigured()) {
      session.flash('error', 'La connexion Instagram n\'est pas encore disponible.')
      return response.redirect().back()
    }

    // Redirect to Late dashboard for account management
    return response.redirect('https://getlate.dev/dashboard')
  }

  /**
   * Restart onboarding - reset onboardingCompleted flag
   * Always starts from strategy step so user can review/change everything
   */
  async restartOnboarding({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant
    if (!restaurant) {
      session.flash('error', 'Aucun restaurant trouvé.')
      return response.redirect().back()
    }

    // Reset onboarding flag - keep existing data
    restaurant.onboardingCompleted = false
    await restaurant.save()

    session.flash('success', 'Vous pouvez maintenant refaire la configuration.')

    // Always start from strategy step to allow reviewing all choices
    return response.redirect().toRoute('onboarding.strategy')
  }
}
