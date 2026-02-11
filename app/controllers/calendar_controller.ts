import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import Mission from '#models/mission'
import LevelService from '#services/level_service'

export default class CalendarController {
  /**
   * Show calendar page with week view (default) and selected day's missions pre-loaded
   */
  async index({ inertia, auth, request }: HttpContext) {
    const user = auth.getUserOrFail()

    // Selected date from query param, default to today (Paris timezone)
    const dateParam = request.input('date')
    const selectedDate = dateParam
      ? DateTime.fromISO(dateParam, { zone: 'utc' })
      : DateTime.now().setZone('Europe/Paris').startOf('day').toUTC()

    const selectedDateStr = selectedDate.toFormat('yyyy-MM-dd')

    // Calculate the month range for missionsByDay (needed for both week and month views)
    const year = selectedDate.year
    const month = selectedDate.month
    const startOfMonth = DateTime.utc(year, month, 1)
    const endOfMonth = startOfMonth.endOf('month')

    // Get all missions for this user in this month range
    const monthMissions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', startOfMonth.toSQL()!)
      .where('assigned_at', '<=', endOfMonth.toSQL()!)
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    // Group missions by day (for calendar dots)
    const missionsByDay: Record<string, { completed: number; skipped: number; pending: number }> = {}

    for (const mission of monthMissions) {
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

    // Pre-load missions for the selected day
    const startOfDay = selectedDate.startOf('day')
    const endOfDay = selectedDate.endOf('day')

    const dayMissions = await Mission.query()
      .where('user_id', user.id)
      .where('assigned_at', '>=', startOfDay.toSQL()!)
      .where('assigned_at', '<=', endOfDay.toSQL()!)
      .preload('missionTemplate')
      .orderBy('assigned_at', 'asc')

    // Get level info
    const levelService = new LevelService()
    const levelInfo = await levelService.getLevelInfo(user.id)

    return inertia.render('calendar/index', {
      year,
      month,
      missionsByDay,
      today: DateTime.now().setZone('Europe/Paris').toFormat('yyyy-MM-dd'),
      selectedDate: selectedDateStr,
      selectedDayMissions: dayMissions.map((m) => ({
        id: m.id,
        status: m.status,
        assignedAt: m.assignedAt.toISO(),
        completedAt: m.completedAt?.toISO() ?? null,
        template: {
          type: m.missionTemplate.type,
          title: m.missionTemplate.title,
        },
      })),
      level: levelInfo,
    })
  }

  /**
   * Get missions for a specific day (AJAX)
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
        completedAt: m.completedAt?.toISO() ?? null,
        template: {
          type: m.missionTemplate.type,
          title: m.missionTemplate.title,
        },
      })),
    })
  }
}
