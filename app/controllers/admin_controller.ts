import type { HttpContext } from '@adonisjs/core/http'
import AdminService from '#services/admin_service'

export default class AdminController {
  private adminService = new AdminService()

  /**
   * Admin Dashboard - Global activity overview (FR38)
   */
  async dashboard({ inertia }: HttpContext) {
    const globalStats = await this.adminService.getGlobalStats()
    const userGrowth = await this.adminService.getUserGrowth(30)
    const recentActivity = await this.adminService.getRecentActivity(10)

    return inertia.render('admin/dashboard', {
      globalStats,
      userGrowth,
      recentActivity,
    })
  }

  /**
   * Users list with filtering (FR39)
   */
  async users({ inertia, request }: HttpContext) {
    const page = Number(request.input('page', 1))
    const filter = request.input('filter', 'all') as 'all' | 'active' | 'inactive'
    const search = request.input('search', '')

    const result = await this.adminService.getUsers({
      page,
      filter,
      search,
      limit: 20,
    })

    return inertia.render('admin/users/index', {
      ...result,
      currentFilter: filter,
      searchQuery: search,
    })
  }

  /**
   * User detail view (FR40)
   */
  async userDetail({ inertia, params }: HttpContext) {
    const userId = Number(params.id)
    const result = await this.adminService.getUserDetail(userId)

    if (!result) {
      return inertia.render('admin/users/not-found')
    }

    return inertia.render('admin/users/show', result)
  }

  /**
   * API: Get user stats for detail page
   */
  async userStats({ response, params }: HttpContext) {
    const userId = Number(params.id)
    const result = await this.adminService.getUserDetail(userId)

    if (!result) {
      return response.notFound({ error: 'User not found' })
    }

    return response.json({
      stats: result.stats,
      subscription: result.subscription
        ? {
            planType: result.subscription.planType,
            status: result.subscription.status,
            currentPeriodEnd: result.subscription.currentPeriodEnd?.toISO(),
          }
        : null,
    })
  }

  /**
   * API: Get platform stats
   */
  async stats({ response }: HttpContext) {
    const stats = await this.adminService.getGlobalStats()
    return response.json(stats)
  }

  /**
   * API: Get user growth data
   */
  async growth({ response, request }: HttpContext) {
    const days = Number(request.input('days', 30))
    const growth = await this.adminService.getUserGrowth(days)
    return response.json({ growth })
  }

  /**
   * API: Get recent activity
   */
  async activity({ response, request }: HttpContext) {
    const limit = Number(request.input('limit', 20))
    const activity = await this.adminService.getRecentActivity(limit)
    return response.json({ activity })
  }
}
