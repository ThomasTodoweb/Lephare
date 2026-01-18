import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import WeeklyReport from '#models/weekly_report'
import Mission from '#models/mission'
import TutorialCompletion from '#models/tutorial_completion'
import Streak from '#models/streak'
import AIService from '#services/ai_service'

export default class ReportsController {
  /**
   * Show list of weekly reports
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const reports = await WeeklyReport.query()
      .where('user_id', user.id)
      .orderBy('week_start_date', 'desc')
      .limit(12) // Last 12 weeks

    // Check for unread report
    const hasUnread = reports.some((r) => !r.isRead)

    return inertia.render('reports/index', {
      reports: reports.map((r) => ({
        id: r.id,
        weekStartDate: r.weekStartDate.toISODate(),
        missionsCompleted: r.missionsCompleted,
        tutorialsViewed: r.tutorialsViewed,
        streakAtEnd: r.streakAtEnd,
        isRead: r.isRead,
      })),
      hasUnread,
    })
  }

  /**
   * Show a specific weekly report
   */
  async show({ inertia, auth, params, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const reportId = Number(params.id)

    if (Number.isNaN(reportId)) {
      return response.redirect().toRoute('reports.index')
    }

    const report = await WeeklyReport.query()
      .where('id', reportId)
      .where('user_id', user.id)
      .first()

    if (!report) {
      return response.redirect().toRoute('reports.index')
    }

    // Mark as read
    if (!report.isRead) {
      report.isRead = true
      await report.save()
    }

    return inertia.render('reports/show', {
      report: {
        id: report.id,
        weekStartDate: report.weekStartDate.toISODate(),
        content: report.content,
        missionsCompleted: report.missionsCompleted,
        tutorialsViewed: report.tutorialsViewed,
        streakAtEnd: report.streakAtEnd,
      },
    })
  }

  /**
   * Generate a weekly report for the current user (called by cron job or manually)
   */
  async generate({ auth, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('restaurant')

    // Get the start of last week (Monday)
    const today = DateTime.utc()
    const lastWeekStart = today.minus({ weeks: 1 }).startOf('week')
    const lastWeekEnd = lastWeekStart.plus({ weeks: 1 })

    // Check if report already exists for this week
    const existingReport = await WeeklyReport.query()
      .where('user_id', user.id)
      .where('week_start_date', lastWeekStart.toISODate()!)
      .first()

    if (existingReport) {
      session.flash('info', 'Le bilan de cette semaine a déjà été généré')
      return response.redirect().toRoute('reports.show', { id: existingReport.id })
    }

    // Calculate stats for the week
    const missionsCompleted = await Mission.query()
      .where('user_id', user.id)
      .where('status', 'completed')
      .where('completed_at', '>=', lastWeekStart.toSQL())
      .where('completed_at', '<', lastWeekEnd.toSQL())
      .count('* as total')
      .first()

    const missionsMissed = await Mission.query()
      .where('user_id', user.id)
      .where('status', 'skipped')
      .where('assigned_at', '>=', lastWeekStart.toSQL())
      .where('assigned_at', '<', lastWeekEnd.toSQL())
      .count('* as total')
      .first()

    const tutorialsWatched = await TutorialCompletion.query()
      .where('user_id', user.id)
      .where('completed_at', '>=', lastWeekStart.toSQL())
      .where('completed_at', '<', lastWeekEnd.toSQL())
      .count('* as total')
      .first()

    const streak = await Streak.query().where('user_id', user.id).first()

    // Try to generate AI content
    const aiService = new AIService()
    let content: string | null = null

    if (aiService.isConfigured()) {
      content = await aiService.generateWeeklyReport({
        missionsCompleted: Number(missionsCompleted?.$extras.total || 0),
        missionsMissed: Number(missionsMissed?.$extras.total || 0),
        tutorialsWatched: Number(tutorialsWatched?.$extras.total || 0),
        currentStreak: streak?.currentStreak || 0,
        strategy: user.restaurant?.strategyId ? 'Communication digitale' : 'Découverte',
      })
    }

    // Fallback content if AI not available
    if (!content) {
      const completed = Number(missionsCompleted?.$extras.total || 0)
      const tutorials = Number(tutorialsWatched?.$extras.total || 0)

      if (completed >= 5) {
        content = `Quelle semaine productive ! Vous avez complété ${completed} missions. Continuez sur cette lancée, vous êtes sur la bonne voie ! 💪`
      } else if (completed > 0) {
        content = `Vous avez complété ${completed} mission${completed > 1 ? 's' : ''} cette semaine. Chaque petit pas compte dans votre progression. La régularité est la clé du succès ! 🌟`
      } else {
        content = `Cette semaine a été calme. Pas de panique, l'important c'est de reprendre le rythme. Une nouvelle semaine commence, c'est l'occasion de repartir du bon pied ! 🚀`
      }

      if (tutorials > 0) {
        content += ` Vous avez également regardé ${tutorials} tutoriel${tutorials > 1 ? 's' : ''}, bravo pour cet investissement dans votre apprentissage !`
      }
    }

    // Create the report
    const report = await WeeklyReport.create({
      userId: user.id,
      weekStartDate: lastWeekStart,
      content,
      missionsCompleted: Number(missionsCompleted?.$extras.total || 0),
      tutorialsViewed: Number(tutorialsWatched?.$extras.total || 0),
      streakAtEnd: streak?.currentStreak || 0,
      isRead: false,
    })

    session.flash('success', 'Votre bilan hebdomadaire a été généré !')
    return response.redirect().toRoute('reports.show', { id: report.id })
  }
}
