import type { HttpContext } from '@adonisjs/core/http'
import Strategy from '#models/strategy'
import { PUBLICATION_RHYTHMS } from '#models/restaurant'
import { strategyValidator, rhythmValidator } from '#validators/onboarding'
import LateService from '#services/late_service'

// Onboarding steps (5 total)
// 1. Restaurant type (handled by RestaurantsController)
// 2. Strategy selection
// 3. Publication rhythm
// 4. Instagram connection
// 5. PWA install (final step - completes onboarding)
// Note: Notifications are now handled via a banner on the dashboard (only for PWA users)

export default class OnboardingController {
  private lateService = new LateService()

  /**
   * Get current onboarding step for a user
   */
  private async getCurrentStep(user: { id: number }, restaurant: { strategyId: number | null; publicationRhythm: string | null; onboardingCompleted: boolean }) {
    if (!restaurant.strategyId) return 2
    if (!restaurant.publicationRhythm) return 3

    // Check Instagram via Late API
    const instagramAccount = await this.lateService.getInstagramAccountForUser(user.id)
    if (!instagramAccount) return 4

    // Step 5 (PWA) is the final step
    return 5
  }

  /**
   * Show strategy selection page (Step 2)
   */
  async showStrategy({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    const strategies = await Strategy.query().where('is_active', true)

    return inertia.render('onboarding/strategy', {
      strategies: strategies.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
      })),
      currentStrategyId: restaurant.strategyId,
      step: 2,
      totalSteps: 5,
    })
  }

  /**
   * Store selected strategy
   */
  async storeStrategy({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    const data = await request.validateUsing(strategyValidator)

    restaurant.strategyId = data.strategy_id
    await restaurant.save()

    session.flash('success', 'Stratégie enregistrée !')

    return response.redirect().toRoute('onboarding.rhythm')
  }

  /**
   * Show publication rhythm selection page (Step 3)
   */
  async showRhythm({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (!restaurant.strategyId) {
      return response.redirect().toRoute('onboarding.strategy')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    return inertia.render('onboarding/rhythm', {
      rhythms: PUBLICATION_RHYTHMS,
      currentRhythm: restaurant.publicationRhythm,
      step: 3,
      totalSteps: 5,
    })
  }

  /**
   * Store selected rhythm
   */
  async storeRhythm({ request, response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    const data = await request.validateUsing(rhythmValidator)

    restaurant.publicationRhythm = data.publication_rhythm
    await restaurant.save()

    session.flash('success', 'Rythme de publication enregistré !')

    return response.redirect().toRoute('onboarding.instagram')
  }

  /**
   * Show Instagram connection page (Step 4)
   * If not connected, redirect directly to OAuth flow
   */
  async showInstagram({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (!restaurant.publicationRhythm) {
      return response.redirect().toRoute('onboarding.rhythm')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    // Check Instagram connection via Late API (not local DB)
    const instagramAccount = await this.lateService.getInstagramAccountForUser(user.id)

    // If not connected, redirect directly to Instagram OAuth
    if (!instagramAccount) {
      return response.redirect().toRoute('instagram.connect')
    }

    // If connected, show the confirmation page
    return inertia.render('onboarding/instagram', {
      isConnected: true,
      instagramUsername: instagramAccount.username,
      instagramProfilePicture: instagramAccount.profilePictureUrl || null,
      step: 4,
      totalSteps: 5,
    })
  }

  /**
   * Show Instagram error page (when connection fails during onboarding)
   */
  async showInstagramError({ inertia, auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    const errorMessage = session.flashMessages.get('error') || 'Une erreur est survenue lors de la connexion Instagram.'

    return inertia.render('onboarding/instagram-error', {
      errorMessage,
      step: 4,
      totalSteps: 5,
    })
  }

  /**
   * Skip Instagram connection - go to PWA step
   */
  async skipInstagram({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    // Don't mark as completed yet - go to PWA step
    return response.redirect().toRoute('onboarding.pwa')
  }

  /**
   * Continue after Instagram connection - go to PWA step
   */
  async continueFromInstagram({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    return response.redirect().toRoute('onboarding.pwa')
  }

  /**
   * Show PWA install page (Step 5 - Final step)
   */
  async showPwa({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    return inertia.render('onboarding/pwa', {
      step: 5,
      totalSteps: 5,
    })
  }

  /**
   * Complete onboarding from PWA step (now the final step)
   */
  async continuePwa({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    // Mark onboarding as completed
    restaurant.onboardingCompleted = true
    await restaurant.save()

    session.flash('success', 'Félicitations ! Vous êtes prêt à démarrer votre aventure Instagram.')

    return response.redirect().toRoute('dashboard')
  }

  /**
   * Complete onboarding (legacy endpoint - kept for compatibility)
   */
  async complete({ response, auth, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    restaurant.onboardingCompleted = true
    await restaurant.save()

    session.flash('success', 'Félicitations ! Vous êtes prêt à démarrer votre aventure Instagram.')

    return response.redirect().toRoute('dashboard')
  }

  /**
   * Get onboarding status (API endpoint for progress bar)
   */
  async status({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.json({
        completed: false,
        currentStep: 1,
        totalSteps: 5,
      })
    }

    if (restaurant.onboardingCompleted) {
      return response.json({
        completed: true,
        currentStep: 5,
        totalSteps: 5,
      })
    }

    const currentStep = await this.getCurrentStep(user, restaurant)

    return response.json({
      completed: false,
      currentStep,
      totalSteps: 5,
      hasStrategy: !!restaurant.strategyId,
      hasRhythm: !!restaurant.publicationRhythm,
    })
  }
}
