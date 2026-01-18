import { DateTime } from 'luxon'
import User from '#models/user'
import Mission from '#models/mission'
import Subscription from '#models/subscription'
import TutorialCompletion from '#models/tutorial_completion'
import Streak from '#models/streak'

interface GlobalStats {
  totalUsers: number
  activeUsers: number
  inactiveUsers: number
  totalMissions: number
  completedMissions: number
  completionRate: number
  totalSubscriptions: number
  activeSubscriptions: number
  trialSubscriptions: number
  tutorialsCompleted: number
  averageStreak: number
}

interface UserGrowth {
  date: string
  count: number
}

interface RecentActivity {
  type: 'user_joined' | 'mission_completed' | 'tutorial_completed' | 'subscription_started'
  userId: number
  userName: string
  timestamp: string
  details?: string
}

interface UserListItem {
  id: number
  fullName: string | null
  email: string
  role: string
  createdAt: string
  lastActivity: string | null
  isActive: boolean
  missionsCompleted: number
  subscriptionStatus: string | null
}

export default class AdminService {
  /**
   * Get global platform statistics
   */
  async getGlobalStats(): Promise<GlobalStats> {
    const thirtyDaysAgo = DateTime.utc().minus({ days: 30 })

    // Total and active users
    const totalUsers = await User.query().where('role', 'user').count('* as total').first()
    const activeUsers = await User.query()
      .where('role', 'user')
      .where('updated_at', '>=', thirtyDaysAgo.toSQL())
      .count('* as total')
      .first()

    const totalUsersCount = Number(totalUsers?.$extras.total || 0)
    const activeUsersCount = Number(activeUsers?.$extras.total || 0)

    // Mission stats
    const totalMissions = await Mission.query().count('* as total').first()
    const completedMissions = await Mission.query()
      .where('status', 'completed')
      .count('* as total')
      .first()

    const totalMissionsCount = Number(totalMissions?.$extras.total || 0)
    const completedMissionsCount = Number(completedMissions?.$extras.total || 0)
    const completionRate =
      totalMissionsCount > 0 ? Math.round((completedMissionsCount / totalMissionsCount) * 100) : 0

    // Subscription stats
    const totalSubscriptions = await Subscription.query().count('* as total').first()
    const activeSubscriptions = await Subscription.query()
      .where('status', 'active')
      .count('* as total')
      .first()
    const trialSubscriptions = await Subscription.query()
      .where('status', 'trialing')
      .count('* as total')
      .first()

    // Tutorial completions
    const tutorialsCompleted = await TutorialCompletion.query().count('* as total').first()

    // Average streak
    const streakAvg = await Streak.query().avg('current_streak as avg').first()

    return {
      totalUsers: totalUsersCount,
      activeUsers: activeUsersCount,
      inactiveUsers: totalUsersCount - activeUsersCount,
      totalMissions: totalMissionsCount,
      completedMissions: completedMissionsCount,
      completionRate,
      totalSubscriptions: Number(totalSubscriptions?.$extras.total || 0),
      activeSubscriptions: Number(activeSubscriptions?.$extras.total || 0),
      trialSubscriptions: Number(trialSubscriptions?.$extras.total || 0),
      tutorialsCompleted: Number(tutorialsCompleted?.$extras.total || 0),
      averageStreak: Math.round(Number(streakAvg?.$extras.avg || 0)),
    }
  }

  /**
   * Get user growth over time
   */
  async getUserGrowth(days: number = 30): Promise<UserGrowth[]> {
    const startDate = DateTime.utc().minus({ days }).startOf('day')

    const users = await User.query()
      .where('role', 'user')
      .where('created_at', '>=', startDate.toSQL())
      .orderBy('created_at', 'asc')

    // Group by day
    const growthByDay: Record<string, number> = {}

    for (let i = 0; i <= days; i++) {
      const date = startDate.plus({ days: i }).toISODate()
      if (date) {
        growthByDay[date] = 0
      }
    }

    for (const user of users) {
      const date = user.createdAt.toISODate()
      if (date && date in growthByDay) {
        growthByDay[date]++
      }
    }

    return Object.entries(growthByDay).map(([date, count]) => ({ date, count }))
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const activities: RecentActivity[] = []

    // Recent user signups
    const recentUsers = await User.query()
      .where('role', 'user')
      .orderBy('created_at', 'desc')
      .limit(5)

    for (const user of recentUsers) {
      activities.push({
        type: 'user_joined',
        userId: user.id,
        userName: user.fullName || user.email,
        timestamp: user.createdAt.toISO() || '',
      })
    }

    // Recent completed missions
    const recentMissions = await Mission.query()
      .where('status', 'completed')
      .whereNotNull('completed_at')
      .preload('user')
      .preload('missionTemplate')
      .orderBy('completed_at', 'desc')
      .limit(5)

    for (const mission of recentMissions) {
      activities.push({
        type: 'mission_completed',
        userId: mission.userId,
        userName: mission.user?.fullName || mission.user?.email || 'Unknown',
        timestamp: mission.completedAt?.toISO() || '',
        details: mission.missionTemplate?.title,
      })
    }

    // Recent tutorial completions
    const recentTutorials = await TutorialCompletion.query()
      .preload('user')
      .preload('tutorial')
      .orderBy('completed_at', 'desc')
      .limit(5)

    for (const completion of recentTutorials) {
      activities.push({
        type: 'tutorial_completed',
        userId: completion.userId,
        userName: completion.user?.fullName || completion.user?.email || 'Unknown',
        timestamp: completion.completedAt.toISO() || '',
        details: completion.tutorial?.title,
      })
    }

    // Recent subscriptions
    const recentSubscriptions = await Subscription.query()
      .where('status', 'active')
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(5)

    for (const sub of recentSubscriptions) {
      activities.push({
        type: 'subscription_started',
        userId: sub.userId,
        userName: sub.user?.fullName || sub.user?.email || 'Unknown',
        timestamp: sub.createdAt.toISO() || '',
        details: sub.planType,
      })
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  /**
   * Get list of users with filtering
   * Optimized with preload and subquery to avoid N+1
   */
  async getUsers(options: {
    page?: number
    limit?: number
    filter?: 'all' | 'active' | 'inactive'
    search?: string
  }): Promise<{ users: UserListItem[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 20, filter = 'all', search } = options
    const thirtyDaysAgo = DateTime.utc().minus({ days: 30 })

    let query = User.query().where('role', 'user')

    if (search) {
      // Sanitize search input to prevent injection
      const sanitizedSearch = search.slice(0, 100).replace(/[%_]/g, '\\$&')
      query = query.where((q) => {
        q.whereILike('email', `%${sanitizedSearch}%`).orWhereILike('full_name', `%${sanitizedSearch}%`)
      })
    }

    if (filter === 'active') {
      query = query.where('updated_at', '>=', thirtyDaysAgo.toSQL())
    } else if (filter === 'inactive') {
      query = query.where('updated_at', '<', thirtyDaysAgo.toSQL())
    }

    const totalResult = await query.clone().count('* as total').first()
    const total = Number(totalResult?.$extras.total || 0)

    // Preload subscription to avoid N+1
    const users = await query
      .preload('subscription')
      .withCount('missions', (q) => q.where('status', 'completed').as('missions_completed'))
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit)

    // Map users without additional queries
    const userList: UserListItem[] = users.map((user) => {
      const isActive = user.updatedAt
        ? user.updatedAt >= thirtyDaysAgo
        : user.createdAt >= thirtyDaysAgo

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt.toISO() || '',
        lastActivity: user.updatedAt?.toISO() || null,
        isActive,
        missionsCompleted: Number(user.$extras.missions_completed || 0),
        subscriptionStatus: user.subscription?.status || null,
      }
    })

    return {
      users: userList,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }
  }

  /**
   * Get detailed user information for admin
   */
  async getUserDetail(userId: number): Promise<{
    user: User | null
    stats: {
      missionsCompleted: number
      missionsTotal: number
      tutorialsCompleted: number
      currentStreak: number
      longestStreak: number
    }
    subscription: Subscription | null
    recentMissions: Mission[]
  } | null> {
    const user = await User.query()
      .where('id', userId)
      .preload('restaurant')
      .preload('instagramConnection')
      .first()

    if (!user) return null

    const missionsCompleted = await Mission.query()
      .where('user_id', userId)
      .where('status', 'completed')
      .count('* as total')
      .first()

    const missionsTotal = await Mission.query()
      .where('user_id', userId)
      .count('* as total')
      .first()

    const tutorialsCompleted = await TutorialCompletion.query()
      .where('user_id', userId)
      .count('* as total')
      .first()

    const streak = await Streak.query().where('user_id', userId).first()

    const subscription = await Subscription.query().where('user_id', userId).first()

    const recentMissions = await Mission.query()
      .where('user_id', userId)
      .preload('missionTemplate')
      .orderBy('created_at', 'desc')
      .limit(10)

    return {
      user,
      stats: {
        missionsCompleted: Number(missionsCompleted?.$extras.total || 0),
        missionsTotal: Number(missionsTotal?.$extras.total || 0),
        tutorialsCompleted: Number(tutorialsCompleted?.$extras.total || 0),
        currentStreak: streak?.currentStreak || 0,
        longestStreak: streak?.longestStreak || 0,
      },
      subscription,
      recentMissions,
    }
  }
}
