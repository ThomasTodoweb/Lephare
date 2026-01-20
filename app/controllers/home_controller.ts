import type { HttpContext } from '@adonisjs/core/http'

export default class HomeController {
  /**
   * Show landing page with auth status
   */
  async index({ inertia, auth }: HttpContext) {
    const isAuthenticated = await auth.check()

    return inertia.render('home', {
      isAuthenticated,
    })
  }
}
