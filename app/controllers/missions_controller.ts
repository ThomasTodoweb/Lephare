import type { HttpContext } from '@adonisjs/core/http'
import Mission from '#models/mission'
import MissionService from '#services/mission_service'

export default class MissionsController {
  /**
   * Helper to format a mission for the frontend
   */
  private formatMission(mission: Mission) {
    return {
      id: mission.id,
      status: mission.status,
      canUseAction: mission.canUsePassOrReload(),
      usedPass: mission.usedPass,
      usedReload: mission.usedReload,
      slotNumber: mission.slotNumber,
      isRecommended: mission.isRecommended,
      template: {
        type: mission.missionTemplate.type,
        title: mission.missionTemplate.title,
        contentIdea: mission.missionTemplate.contentIdea,
      },
    }
  }

  /**
   * Show today's missions page (redirects to recommended mission)
   */
  async today({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionService = new MissionService()

    const missions = await missionService.getTodayMissions(user.id)

    // Redirect to the recommended mission, or first one
    const recommended = missions.find((m) => m.isRecommended) || missions[0]
    if (recommended) {
      return response.redirect().toRoute('missions.show', { id: recommended.id })
    }

    // No missions available - this shouldn't happen normally
    return response.redirect().toRoute('dashboard')
  }

  /**
   * Show a specific mission
   */
  async show({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = Number(params.id)
    const missionService = new MissionService()

    // Get the specific mission
    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .preload('missionTemplate')
      .first()

    if (!mission) {
      return inertia.render('missions/today', { mission: null, todayMissions: [] })
    }

    // Get all today's missions for navigation
    const todayMissions = await missionService.getTodayMissions(user.id)

    return inertia.render('missions/today', {
      mission: this.formatMission(mission),
      todayMissions: todayMissions.map((m) => this.formatMission(m)),
    })
  }

  /**
   * Accept mission and start the flow
   */
  async accept({ response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = Number(params.id)
    const missionService = new MissionService()

    // Verify user owns this mission before redirecting
    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .preload('missionTemplate')
      .first()

    if (!mission) {
      session.flash('error', 'Mission introuvable')
      return response.redirect().toRoute('missions.today')
    }

    // For tuto missions, redirect to the tutorial
    if (mission.missionTemplate.type === 'tuto' && mission.missionTemplate.tutorialId) {
      return response.redirect().toRoute('tutorials.show', { id: mission.missionTemplate.tutorialId })
    }

    // For engagement missions, mark as completed and show bravo
    if (mission.missionTemplate.type === 'engagement') {
      await missionService.completeMission(missionId, user.id)
      session.flash('success', 'Mission accomplie !')
      return response.redirect().toRoute('dashboard')
    }

    // For publication missions, redirect to photo capture
    return response.redirect().toRoute('missions.photo', { id: missionId })
  }

  /**
   * Skip today's mission
   */
  async skip({ response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
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
    const user = auth.getUserOrFail()
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
    const user = auth.getUserOrFail()
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
        publication: m.publication
          ? {
              id: m.publication.id,
              contentType: m.publication.contentType,
              imagePath: m.publication.imagePath,
              mediaItems: m.publication.mediaItems || [],
              status: m.publication.status,
              instagramPostId: m.publication.instagramPostId,
              publishedAt: m.publication.publishedAt?.toISO(),
            }
          : null,
      })),
    })
  }
}
