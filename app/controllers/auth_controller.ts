import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'
import StripeService from '#services/stripe_service'

export default class AuthController {
  private stripeService = new StripeService()

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async register({ request, response, auth }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const user = await User.create({
      email: data.email,
      password: data.password,
      role: 'user',
    })

    // Create 7-day free trial subscription
    await this.stripeService.createTrialSubscription(user.id, 7)

    await auth.use('web').login(user)

    return response.redirect().toRoute('restaurant.type')
  }

  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)
      await auth.use('web').login(user)

      const restaurant = await user.related('restaurant').query().first()
      if (!restaurant) {
        return response.redirect().toRoute('restaurant.type')
      }

      return response.redirect().toRoute('dashboard')
    } catch {
      session.flash('errors', { email: 'Email ou mot de passe incorrect' })
      return response.redirect().back()
    }
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Déconnexion réussie')
    return response.redirect().toRoute('login')
  }
}
