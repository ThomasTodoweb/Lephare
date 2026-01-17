import type { HttpContext } from '@adonisjs/core/http'

export default class DashboardController {
  async index({ inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const restaurant = await user.related('restaurant').query().first()

    if (!restaurant) {
      return response.redirect().toRoute('restaurant.type')
    }

    return inertia.render('dashboard', {
      user: user.serialize(),
      restaurant: restaurant.serialize(),
    })
  }
}
