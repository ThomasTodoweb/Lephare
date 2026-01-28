import type { HttpContext } from '@adonisjs/core/http'
import LateService from '#services/late_service'
import GamificationService from '#services/gamification_service'
import LevelService from '#services/level_service'
import StripeService from '#services/stripe_service'
import Strategy from '#models/strategy'
import PushSubscription from '#models/push_subscription'
import { RESTAURANT_TYPES, PUBLICATION_RHYTHMS } from '#models/restaurant'
import {
  createUpdateEmailValidator,
  updateRestaurantNameValidator,
  updateRestaurantTypeValidator,
  updatePublicationRhythmValidator,
  updateStrategyValidator,
} from '#validators/profile'

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

    // Get level info
    const levelService = new LevelService()
    const levelInfo = await levelService.getLevelInfo(user.id)

    // Get subscription info
    const subscription = await this.stripeService.getSubscription(user.id)

    // Get strategy info if restaurant has one
    let strategy = null
    if (restaurant?.strategyId) {
      strategy = await Strategy.find(restaurant.strategyId)
    }

    // Get all available strategies for the edit form
    const strategies = await Strategy.query().where('is_active', true)

    // Get user's notification reminder time from push subscriptions
    const pushSubscription = await PushSubscription.query()
      .where('user_id', user.id)
      .where('is_active', true)
      .first()
    const notificationReminderTime = pushSubscription?.reminderTime || '10:00'

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
      // Options for edit forms
      restaurantTypes: RESTAURANT_TYPES,
      publicationRhythms: PUBLICATION_RHYTHMS,
      strategies: strategies.map((s) => ({
        id: s.id,
        name: s.name,
        icon: s.icon,
        description: s.description,
      })),
      // Notification settings
      notificationReminderTime,
      // Level info
      level: levelInfo,
      // Email preferences
      emailPreferences: {
        dailyMission: user.emailDailyMissionEnabled ?? true,
        weeklySummary: user.emailWeeklySummaryEnabled ?? true,
        accountChanges: user.emailAccountChangesEnabled ?? true,
      },
    })
  }

  /**
   * Update user email
   */
  async updateEmail({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()

    const validator = createUpdateEmailValidator(user.id)
    const data = await request.validateUsing(validator)

    user.email = data.email
    await user.save()

    session.flash('success', 'Email mis à jour avec succès.')
    return response.redirect().back()
  }

  /**
   * Update restaurant name
   */
  async updateRestaurantName({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant
    if (!restaurant) {
      session.flash('error', 'Aucun restaurant trouvé.')
      return response.redirect().back()
    }

    const data = await request.validateUsing(updateRestaurantNameValidator)

    restaurant.name = data.name
    await restaurant.save()

    session.flash('success', 'Nom du restaurant mis à jour.')
    return response.redirect().back()
  }

  /**
   * Update restaurant type
   */
  async updateRestaurantType({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant
    if (!restaurant) {
      session.flash('error', 'Aucun restaurant trouvé.')
      return response.redirect().back()
    }

    const data = await request.validateUsing(updateRestaurantTypeValidator)

    restaurant.type = data.type
    await restaurant.save()

    session.flash('success', 'Type de restaurant mis à jour.')
    return response.redirect().back()
  }

  /**
   * Update publication rhythm
   */
  async updatePublicationRhythm({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant
    if (!restaurant) {
      session.flash('error', 'Aucun restaurant trouvé.')
      return response.redirect().back()
    }

    const data = await request.validateUsing(updatePublicationRhythmValidator)

    restaurant.publicationRhythm = data.publication_rhythm
    await restaurant.save()

    session.flash('success', 'Rythme de publication mis à jour.')
    return response.redirect().back()
  }

  /**
   * Update strategy (objective)
   */
  async updateStrategy({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    const restaurant = user.restaurant
    if (!restaurant) {
      session.flash('error', 'Aucun restaurant trouvé.')
      return response.redirect().back()
    }

    const data = await request.validateUsing(updateStrategyValidator)

    // Verify the strategy exists and is active
    const strategy = await Strategy.query()
      .where('id', data.strategy_id)
      .where('is_active', true)
      .first()

    if (!strategy) {
      session.flash('error', 'Stratégie non valide.')
      return response.redirect().back()
    }

    restaurant.strategyId = data.strategy_id
    await restaurant.save()

    session.flash('success', 'Objectif mis à jour avec succès.')
    return response.redirect().back()
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
   * Update email preferences
   */
  async updateEmailPreferences({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { dailyMission, weeklySummary, accountChanges } = request.only([
      'dailyMission',
      'weeklySummary',
      'accountChanges',
    ])

    // Update preferences (only if provided)
    if (typeof dailyMission === 'boolean') {
      user.emailDailyMissionEnabled = dailyMission
    }
    if (typeof weeklySummary === 'boolean') {
      user.emailWeeklySummaryEnabled = weeklySummary
    }
    if (typeof accountChanges === 'boolean') {
      user.emailAccountChangesEnabled = accountChanges
    }

    await user.save()

    return response.json({ success: true })
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
