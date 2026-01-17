import type { HttpContext } from '@adonisjs/core/http'
import MissionService from '#services/mission_service'

export default class MissionsController {
  /**
   * Show today's mission page
   */
  async today({ inertia, auth }: HttpContext) {
    const user = auth.user!
    const missionService = new MissionService()

    const mission = await missionService.getTodayMission(user.id)

    return inertia.render('missions/today', {
      mission: mission
        ? {
            id: mission.id,
            status: mission.status,
            canUseAction: mission.canUsePassOrReload(),
            usedPass: mission.usedPass,
            usedReload: mission.usedReload,
            template: {
              type: mission.missionTemplate.type,
              title: mission.missionTemplate.title,
              contentIdea: mission.missionTemplate.contentIdea,
            },
          }
        : null,
    })
  }

  /**
   * Accept mission and start the flow
   */
  async accept({ response, params }: HttpContext) {
    const missionId = params.id

    // Just redirect to photo capture page
    return response.redirect().toRoute('missions.photo', { id: missionId })
  }

  /**
   * Skip today's mission
   */
  async skip({ response, auth, params, session }: HttpContext) {
    const user = auth.user!
    const missionService = new MissionService()

    const result = await missionService.skipMission(Number(params.id), user.id)

    if (!result.success) {
      session.flash('error', result.error || 'Impossible de passer la mission')
      return response.redirect().back()
    }

    session.flash('success', 'Mission passée. À demain !')
    return response.redirect().toRoute('dashboard')
  }

  /**
   * Reload mission (get a different one)
   */
  async reload({ response, auth, params, session }: HttpContext) {
    const user = auth.user!
    const missionService = new MissionService()

    const result = await missionService.reloadMission(Number(params.id), user.id)

    if (!result.success) {
      session.flash('error', result.error || 'Impossible de recharger la mission')
      return response.redirect().back()
    }

    session.flash('success', 'Nouvelle mission chargée !')
    return response.redirect().toRoute('missions.today')
  }

  /**
   * Show mission history
   */
  async history({ inertia, auth }: HttpContext) {
    const user = auth.user!
    const missionService = new MissionService()

    const missions = await missionService.getMissionHistory(user.id)

    return inertia.render('missions/history', {
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
