import type { HttpContext } from '@adonisjs/core/http'
import Strategy from '#models/strategy'
import { PUBLICATION_RHYTHMS } from '#models/restaurant'
import { strategyValidator, rhythmValidator } from '#validators/onboarding'

export default class OnboardingController {
  /**
   * Show strategy selection page
   */
  async showStrategy({ inertia, auth, response }: HttpContext) {
    const user = auth.user!
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
    })
  }

  /**
   * Store selected strategy
   */
  async storeStrategy({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
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
   * Show publication rhythm selection page
   */
  async showRhythm({ inertia, auth, response }: HttpContext) {
    const user = auth.user!
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
    })
  }

  /**
   * Store selected rhythm
   */
  async storeRhythm({ request, response, auth, session }: HttpContext) {
    const user = auth.user!
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
   * Show Instagram connection page
   */
  async showInstagram({ inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const restaurant = await user.related('restaurant').query().first()
    const instagramConnection = await user.related('instagramConnection').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    if (!restaurant.publicationRhythm) {
      return response.redirect().toRoute('onboarding.rhythm')
    }

    if (restaurant.onboardingCompleted) {
      return response.redirect().toRoute('dashboard')
    }

    return inertia.render('onboarding/instagram', {
      isConnected: !!instagramConnection,
      instagramUsername: instagramConnection?.instagramUsername || null,
    })
  }

  /**
   * Skip Instagram connection (optional)
   */
  async skipInstagram({ response, auth, session }: HttpContext) {
    const user = auth.user!
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    restaurant.onboardingCompleted = true
    await restaurant.save()

    session.flash('success', 'Bienvenue sur Le Phare ! Vous pourrez connecter Instagram plus tard.')

    return response.redirect().toRoute('dashboard')
  }

  /**
   * Complete onboarding after Instagram connection
   */
  async complete({ response, auth, session }: HttpContext) {
    const user = auth.user!
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    restaurant.onboardingCompleted = true
    await restaurant.save()

    session.flash('success', 'Félicitations ! Vous êtes prêt à démarrer votre aventure Instagram.')

    return response.redirect().toRoute('dashboard')
  }
}
