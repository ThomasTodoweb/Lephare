import type { HttpContext } from '@adonisjs/core/http'
import Restaurant from '#models/restaurant'
import { restaurantTypeValidator } from '#validators/restaurant'

const restaurantTypes = [
  { value: 'brasserie', label: 'Brasserie', icon: '🍽️' },
  { value: 'gastronomique', label: 'Gastronomique', icon: '⭐' },
  { value: 'fast_food', label: 'Fast-food', icon: '🍔' },
  { value: 'pizzeria', label: 'Pizzeria', icon: '🍕' },
  { value: 'cafe_bar', label: 'Café / Bar', icon: '☕' },
  { value: 'autre', label: 'Autre', icon: '🍴' },
]

export default class RestaurantsController {
  async showTypeChoice({ inertia, auth, response }: HttpContext) {
    const user = auth.user!
    const existingRestaurant = await user.related('restaurant').query().first()

    if (existingRestaurant) {
      return response.redirect().toRoute('dashboard')
    }

    return inertia.render('restaurant/type', { restaurantTypes })
  }

  async storeType({ request, response, auth }: HttpContext) {
    const user = auth.user!

    const existingRestaurant = await user.related('restaurant').query().first()
    if (existingRestaurant) {
      return response.redirect().toRoute('dashboard')
    }

    const data = await request.validateUsing(restaurantTypeValidator)

    await Restaurant.create({
      userId: user.id,
      name: data.name,
      type: data.type,
    })

    return response.redirect().toRoute('onboarding.strategy')
  }
}
