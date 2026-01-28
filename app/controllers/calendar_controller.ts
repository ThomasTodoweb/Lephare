import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Mission from '#models/mission'
import LevelService from '#services/level_service'

export default class CalendarController {
  /**
   * Show calendar page with monthly view
   */
  async index({ inertia, auth, request }: HttpContext) {
    const user = auth.getUserOrFail()

    // Get month and year from query params, default to current month
    const year = Number(request.input('year')) || DateTime.utc().year
    const month = Number(request.input('month')) || DateTime.utc().month

    // Calculate start and end of month
    const startOfMonth = DateTime.utc(year, month, 1)
    const endOfMonth = startOfMonth.endOf('month')

    // Get all missions for this user in this month range
    const missions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', startOfMonth.toSQL()!)
      .where('assigned_at', '<=', endOfMonth.toSQL()!)
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    // Group missions by day
    const missionsByDay: Record<string, { completed: number; skipped: number; pending: number }> = {}

    for (const mission of missions) {
      const dayKey = mission.assignedAt.toFormat('yyyy-MM-dd')
      if (!missionsByDay[dayKey]) {
        missionsByDay[dayKey] = { completed: 0, skipped: 0, pending: 0 }
      }

      if (mission.status === 'completed') {
        missionsByDay[dayKey].completed++
      } else if (mission.status === 'skipped') {
        missionsByDay[dayKey].skipped++
      } else {
        missionsByDay[dayKey].pending++
      }
    }

    // Get upcoming pending missions (next 14 days)
    const upcomingStart = DateTime.utc().startOf('day').plus({ days: 1 })
    const upcomingEnd = upcomingStart.plus({ days: 14 })

    const upcomingMissions = await Mission.query()
      .where('user_id', user.id)
      .where('status', 'pending')
      .where('assigned_at', '>=', upcomingStart.toSQL()!)
      .where('assigned_at', '<=', upcomingEnd.toSQL()!)
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')
      .limit(10)

    // Get level info
    const levelService = new LevelService()
    const levelInfo = await levelService.getLevelInfo(user.id)

    return inertia.render('calendar/index', {
      year,
      month,
      monthName: startOfMonth.setLocale('fr').toFormat('MMMM yyyy'),
      missionsByDay,
      today: DateTime.utc().toFormat('yyyy-MM-dd'),
      upcomingMissions: upcomingMissions.map((m) => ({
        id: m.id,
        date: m.assignedAt.toFormat('yyyy-MM-dd'),
        dateFormatted: m.assignedAt.setLocale('fr').toFormat('ccc dd MMM'),
        type: m.missionTemplate?.type || 'post',
        title: m.missionTemplate?.title || 'Mission',
      })),
      level: levelInfo,
    })
  }

  /**
   * Get missions for a specific day
   */
  async day({ auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const dateParam = params.date

    // Parse the date
    const date = DateTime.fromISO(dateParam, { zone: 'utc' })
    if (!date.isValid) {
      return response.badRequest({ error: 'Date invalide' })
    }

    // Get missions for this day
    const startOfDay = date.startOf('day')
    const endOfDay = date.endOf('day')

    const missions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', startOfDay.toSQL())
      .where('assigned_at', '<=', endOfDay.toSQL())
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    return response.json({
      date: dateParam,
      missions: missions.map((m) => ({
        id: m.id,
        status: m.status,
        assignedAt: m.assignedAt.toISO(),
        completedAt: m.completedAt?.toISO(),
        template: {
          type: m.missionTemplate.type,
          title: m.missionTemplate.title,
        },
      })),
    })
  }
}
