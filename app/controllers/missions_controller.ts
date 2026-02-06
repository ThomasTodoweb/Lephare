import type { HttpContext } from '@adonisjs/core/http'
import Mission from '#models/mission'
import MissionService from '#services/mission_service'

export default class MissionsController {
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
   * Show a specific mission - redirects directly to mission creation flow
   * (Previously showed an intermediate page, now goes straight to publications/mission.tsx)
   */
  async show({ response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = Number(params.id)

    // Get the specific mission
    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .preload('missionTemplate')
      .first()

    if (!mission) {
      session.flash('error', 'Mission introuvable')
      return response.redirect().toRoute('dashboard')
    }

    // For tuto missions, redirect to the tutorial
    if (mission.missionTemplate.type === 'tuto' && mission.missionTemplate.tutorialId) {
      return response.redirect().toRoute('tutorials.show', { id: mission.missionTemplate.tutorialId })
    }

    // For engagement missions, mark as completed and show bravo
    if (mission.missionTemplate.type === 'engagement') {
      const missionService = new MissionService()
      await missionService.completeMission(missionId, user.id)
      session.flash('success', 'Mission accomplie !')
      return response.redirect().toRoute('dashboard')
    }

    // For publication missions, redirect directly to mission creation page
    return response.redirect().toRoute('missions.photo', { id: missionId })
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
