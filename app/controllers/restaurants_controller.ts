import type { HttpContext } from '@adonisjs/core/http'
import Restaurant, { RESTAURANT_TYPES } from '#models/restaurant'
import { restaurantTypeValidator } from '#validators/restaurant'

export default class RestaurantsController {
  async showTypeChoice({ inertia, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const existingRestaurant = await user.related('restaurant').query().first()

    if (existingRestaurant) {
      return response.redirect().toRoute('dashboard')
    }

    return inertia.render('restaurant/type', { restaurantTypes: RESTAURANT_TYPES })
  }

  async storeType({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const existingRestaurant = await user.related('restaurant').query().first()
    if (existingRestaurant) {
      return response.redirect().toRoute('dashboard')
    }

    const data = await request.validateUsing(restaurantTypeValidator)

    await Restaurant.create({
      userId: user.id,
      name: data.name,
      type: data.type,
      city: data.city,
    })

    return response.redirect().toRoute('onboarding.welcome')
  }
}
