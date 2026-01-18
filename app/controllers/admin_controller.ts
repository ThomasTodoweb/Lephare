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
    const rawPage = Number(request.input('page', 1))
    const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage
    const filter = request.input('filter', 'all') as 'all' | 'active' | 'inactive'
    const search = request.input('search', '') as string

    const result = await this.adminService.getUsers({
      page,
      filter,
      search: search.slice(0, 100), // Limit search length
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

    if (Number.isNaN(userId) || userId <= 0) {
      return inertia.render('admin/users/not-found')
    }

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

    if (Number.isNaN(userId) || userId <= 0) {
      return response.badRequest({ error: 'Invalid user ID' })
    }

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
    const rawDays = Number(request.input('days', 30))
    const days = Number.isNaN(rawDays) || rawDays < 1 ? 30 : Math.min(rawDays, 365)
    const growth = await this.adminService.getUserGrowth(days)
    return response.json({ growth })
  }

  /**
   * API: Get recent activity
   */
  async activity({ response, request }: HttpContext) {
    const rawLimit = Number(request.input('limit', 20))
    const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 20 : Math.min(rawLimit, 100)
    const activity = await this.adminService.getRecentActivity(limit)
    return response.json({ activity })
  }
}
