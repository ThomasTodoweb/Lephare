import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import Mission from '#models/mission'
import Publication from '#models/publication'
import MissionService from '#services/mission_service'
import AIService from '#services/ai_service'
import LaterService from '#services/later_service'

const MAX_CAPTION_LENGTH = 2200 // Instagram's limit

export default class PublicationsController {
  /**
   * Show photo capture/upload page
   */
  async photo({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = params.id

    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .preload('missionTemplate')
      .first()

    if (!mission) {
      return inertia.render('errors/not_found')
    }

    return inertia.render('publications/photo', {
      mission: {
        id: mission.id,
        template: {
          type: mission.missionTemplate.type,
          title: mission.missionTemplate.title,
          contentIdea: mission.missionTemplate.contentIdea,
        },
      },
    })
  }

  /**
   * Handle photo upload
   */
  async uploadPhoto({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = params.id

    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .first()

    if (!mission) {
      session.flash('error', 'Mission introuvable')
      return response.redirect().toRoute('missions.today')
    }

    const photo = request.file('photo', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!photo || !photo.isValid) {
      session.flash('error', photo?.errors?.[0]?.message || 'Photo invalide')
      return response.redirect().back()
    }

    // Generate unique filename
    const fileName = `${user.id}_${cuid()}.${photo.extname}`

    // Move to uploads folder
    await photo.move(app.makePath('storage/uploads'), {
      name: fileName,
    })

    // Create publication draft
    const publication = await Publication.create({
      userId: user.id,
      missionId: mission.id,
      imagePath: `storage/uploads/${fileName}`,
      caption: '',
      status: 'draft',
    })

    return response.redirect().toRoute('publications.description', { id: publication.id })
  }

  /**
   * Show description editing page
   */
  async description({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const publicationId = params.id

    const publication = await Publication.query()
      .where('id', publicationId)
      .where('user_id', user.id)
      .preload('mission', (query) => {
        query.preload('missionTemplate')
      })
      .first()

    if (!publication) {
      return inertia.render('errors/not_found')
    }

    // Generate AI description if not already done
    let aiCaption = publication.aiGeneratedCaption
    if (!aiCaption && publication.mission?.missionTemplate) {
      const aiService = new AIService()
      aiCaption = await aiService.generateDescription({
        missionTitle: publication.mission.missionTemplate.title,
        missionType: publication.mission.missionTemplate.type,
        contentIdea: publication.mission.missionTemplate.contentIdea,
      })

      if (aiCaption) {
        publication.aiGeneratedCaption = aiCaption
        publication.caption = aiCaption
        await publication.save()
      }
    }

    return inertia.render('publications/description', {
      publication: {
        id: publication.id,
        imagePath: publication.imagePath,
        caption: publication.caption || aiCaption || '',
        aiGeneratedCaption: aiCaption,
      },
      mission: publication.mission
        ? {
            id: publication.mission.id,
            template: {
              title: publication.mission.missionTemplate.title,
              type: publication.mission.missionTemplate.type,
            },
          }
        : null,
    })
  }

  /**
   * Update caption
   */
  async updateCaption({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const publicationId = params.id

    const publication = await Publication.query()
      .where('id', publicationId)
      .where('user_id', user.id)
      .first()

    if (!publication) {
      session.flash('error', 'Publication introuvable')
      return response.redirect().toRoute('missions.today')
    }

    const caption = request.input('caption', '').substring(0, MAX_CAPTION_LENGTH)
    publication.caption = caption
    await publication.save()

    return response.redirect().back()
  }

  /**
   * Publish to Instagram
   */
  async publish({ response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const publicationId = params.id

    const publication = await Publication.query()
      .where('id', publicationId)
      .where('user_id', user.id)
      .first()

    if (!publication) {
      session.flash('error', 'Publication introuvable')
      return response.redirect().toRoute('missions.today')
    }

    // Check if user has Instagram connected
    await user.load('instagramConnection')
    if (!user.instagramConnection) {
      session.flash('error', 'Veuillez d\'abord connecter votre compte Instagram')
      return response.redirect().toRoute('profile')
    }

    // Try to publish via Later
    const laterService = new LaterService()
    const result = await laterService.publishToInstagram(
      user.id,
      publication.imagePath,
      publication.caption
    )

    if (result.success) {
      publication.status = 'published'
      publication.laterMediaId = result.mediaId || null
      publication.publishedAt = DateTime.now()
      await publication.save()

      // Complete the mission
      if (publication.missionId) {
        const missionService = new MissionService()
        await missionService.completeMission(publication.missionId, user.id)
      }

      return response.redirect().toRoute('publications.bravo', { id: publication.id })
    } else {
      publication.status = 'failed'
      publication.errorMessage = result.error || 'Erreur inconnue'
      await publication.save()

      session.flash('error', result.error || 'La publication a échoué. Veuillez réessayer.')
      return response.redirect().back()
    }
  }

  /**
   * Show bravo/celebration page
   */
  async bravo({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const publicationId = params.id

    const publication = await Publication.query()
      .where('id', publicationId)
      .where('user_id', user.id)
      .first()

    if (!publication) {
      return inertia.render('errors/not_found')
    }

    return inertia.render('publications/bravo', {
      publication: {
        id: publication.id,
        imagePath: publication.imagePath,
      },
    })
  }
}
