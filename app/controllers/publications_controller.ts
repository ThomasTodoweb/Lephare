import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { readFile } from 'node:fs/promises'
import Mission from '#models/mission'
import Publication, { type ContentType, type PublicationMediaItem } from '#models/publication'
import Restaurant from '#models/restaurant'
import MissionService from '#services/mission_service'
import AIService from '#services/ai_service'
import LateService, { type MediaItem } from '#services/late_service'

const MAX_CAPTION_LENGTH = 2200 // Instagram's limit

// Map mission template type to content type
const MISSION_TYPE_TO_CONTENT_TYPE: Record<string, ContentType> = {
  post: 'post',
  carousel: 'carousel',
  reel: 'reel',
  story: 'story',
  tuto: 'reel', // Tutorials are reels
  engagement: 'post', // Engagement missions default to post
}

export default class PublicationsController {
  /**
   * Show media capture/upload page
   * Adapts based on the mission type (post, carousel, reel, story)
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

    // Determine content type from mission template
    const contentType = MISSION_TYPE_TO_CONTENT_TYPE[mission.missionTemplate.type] || 'post'

    return inertia.render('publications/media', {
      mission: {
        id: mission.id,
        template: {
          type: mission.missionTemplate.type,
          title: mission.missionTemplate.title,
          contentIdea: mission.missionTemplate.contentIdea,
        },
      },
      contentType,
      maxImages: contentType === 'carousel' ? 10 : 1,
      acceptVideo: contentType === 'reel' || contentType === 'story',
    })
  }

  /**
   * Handle media upload (photos, videos, multiple files for carousel)
   */
  async uploadPhoto({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const missionId = params.id

    const mission = await Mission.query()
      .where('id', missionId)
      .where('user_id', user.id)
      .preload('missionTemplate')
      .first()

    if (!mission) {
      session.flash('error', 'Mission introuvable')
      return response.redirect().toRoute('missions.today')
    }

    // Determine content type from mission template
    const contentType = MISSION_TYPE_TO_CONTENT_TYPE[mission.missionTemplate.type] || 'post'
    const isReel = contentType === 'reel'
    const isStory = contentType === 'story'
    const isCarousel = contentType === 'carousel'

    // Check if a video was uploaded (for reels and stories)
    const videoFile = request.file('video', {
      size: '100mb',
      extnames: ['mp4', 'mov', 'webm'],
    })
    const hasVideo = videoFile && videoFile.isValid

    // Handle video upload for reels and stories with video
    if (isReel || (isStory && hasVideo)) {
      // Use the already validated video file
      if (!videoFile || !videoFile.isValid) {
        session.flash('error', videoFile?.errors?.[0]?.message || 'Vidéo invalide')
        return response.redirect().back()
      }

      const fileName = `${user.id}_${cuid()}.${videoFile.extname}`
      await videoFile.move(app.makePath('storage/uploads'), { name: fileName })

      // Handle optional cover image
      let coverImagePath: string | null = null
      const coverImage = request.file('cover', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })
      if (coverImage && coverImage.isValid) {
        const coverFileName = `${user.id}_cover_${cuid()}.${coverImage.extname}`
        await coverImage.move(app.makePath('storage/uploads'), { name: coverFileName })
        coverImagePath = `storage/uploads/${coverFileName}`
      }

      const shareToFeed = request.input('shareToFeed') === 'true'

      const mediaItems: PublicationMediaItem[] = [
        { type: 'video', path: `storage/uploads/${fileName}`, order: 0 },
      ]

      const publication = await Publication.create({
        userId: user.id,
        missionId: mission.id,
        imagePath: `storage/uploads/${fileName}`, // Keep for backward compatibility
        contentType: isStory ? 'story' : 'reel',
        mediaItems,
        shareToFeed: isReel ? shareToFeed : false, // Only reels can share to feed
        coverImagePath: isReel ? coverImagePath : null, // Only reels have cover images
        caption: '',
        status: 'draft',
      })

      return response.redirect().toRoute('publications.description', { id: publication.id })
    }

    // Handle carousel (multiple images)
    if (isCarousel) {
      const photos = request.files('photos', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp'],
      })

      if (!photos || photos.length === 0) {
        session.flash('error', 'Veuillez sélectionner au moins une image')
        return response.redirect().back()
      }

      if (photos.length > 10) {
        session.flash('error', 'Maximum 10 images pour un carrousel')
        return response.redirect().back()
      }

      const mediaItems: PublicationMediaItem[] = []
      let firstImagePath = ''

      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i]
        if (!photo.isValid) {
          session.flash('error', photo.errors?.[0]?.message || `Image ${i + 1} invalide`)
          return response.redirect().back()
        }

        const fileName = `${user.id}_${cuid()}.${photo.extname}`
        await photo.move(app.makePath('storage/uploads'), { name: fileName })

        const path = `storage/uploads/${fileName}`
        mediaItems.push({ type: 'image', path, order: i })

        if (i === 0) {
          firstImagePath = path
        }
      }

      const publication = await Publication.create({
        userId: user.id,
        missionId: mission.id,
        imagePath: firstImagePath, // First image for backward compatibility
        contentType: 'carousel',
        mediaItems,
        caption: '',
        status: 'draft',
      })

      return response.redirect().toRoute('publications.description', { id: publication.id })
    }

    // Handle single photo (post or story)
    const photo = request.file('photo', {
      size: '5mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!photo || !photo.isValid) {
      session.flash('error', photo?.errors?.[0]?.message || 'Photo invalide')
      return response.redirect().back()
    }

    const fileName = `${user.id}_${cuid()}.${photo.extname}`
    await photo.move(app.makePath('storage/uploads'), { name: fileName })

    const mediaItems: PublicationMediaItem[] = [
      { type: 'image', path: `storage/uploads/${fileName}`, order: 0 },
    ]

    const publication = await Publication.create({
      userId: user.id,
      missionId: mission.id,
      imagePath: `storage/uploads/${fileName}`,
      contentType: contentType as ContentType,
      mediaItems,
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

    // Load restaurant for context
    const restaurant = await Restaurant.query().where('user_id', user.id).first()

    // Generate AI description if not already done
    let aiCaption = publication.aiGeneratedCaption
    if (!aiCaption && publication.mission?.missionTemplate) {
      const aiService = new AIService()

      // Try to read the image for vision analysis
      let imageBase64: string | undefined
      let imageMimeType: string | undefined

      try {
        const imagePath = app.makePath(publication.imagePath)
        const imageBuffer = await readFile(imagePath)
        imageBase64 = imageBuffer.toString('base64')

        // Determine mime type from extension
        const ext = publication.imagePath.split('.').pop()?.toLowerCase()
        if (ext === 'jpg' || ext === 'jpeg') {
          imageMimeType = 'image/jpeg'
        } else if (ext === 'png') {
          imageMimeType = 'image/png'
        } else if (ext === 'webp') {
          imageMimeType = 'image/webp'
        }
      } catch (error) {
        console.error('Failed to read image for AI analysis:', error)
      }

      aiCaption = await aiService.generateDescription({
        missionTitle: publication.mission.missionTemplate.title,
        missionType: publication.mission.missionTemplate.type,
        contentIdea: publication.mission.missionTemplate.contentIdea,
        restaurantName: restaurant?.name,
        restaurantType: restaurant?.type,
        restaurantCity: restaurant?.city || undefined,
        imageBase64,
        imageMimeType,
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
        contentType: publication.contentType || 'post',
        mediaItems: publication.mediaItems || [],
        shareToFeed: publication.shareToFeed,
        coverImagePath: publication.coverImagePath,
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

    const rawCaption = request.input('caption') || ''
    const caption = rawCaption.substring(0, MAX_CAPTION_LENGTH)
    publication.caption = caption
    await publication.save()

    return response.redirect().back()
  }

  /**
   * Publish to Instagram
   * Supports post, carousel, reel, and story content types
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

    // Check if Late API is configured and has Instagram account
    const lateService = new LateService()
    if (!lateService.isConfigured()) {
      session.flash('error', 'La publication Instagram n\'est pas encore configurée')
      return response.redirect().toRoute('profile')
    }

    const instagramAccount = await lateService.getInstagramAccountForUser(user.id)
    if (!instagramAccount) {
      session.flash('error', 'Aucun compte Instagram connecté. Connectez-vous sur getlate.dev')
      return response.redirect().toRoute('profile')
    }

    // Build media URLs
    const baseUrl = process.env.APP_URL || 'http://localhost:3333'

    // Build media items for Late API
    const mediaItems: MediaItem[] = []

    if (publication.mediaItems && publication.mediaItems.length > 0) {
      for (const item of publication.mediaItems) {
        mediaItems.push({
          type: item.type,
          url: `${baseUrl}/${item.path}`,
        })
      }
    } else {
      // Fallback to imagePath for backward compatibility
      mediaItems.push({
        type: publication.contentType === 'reel' ? 'video' : 'image',
        url: `${baseUrl}/${publication.imagePath}`,
      })
    }

    // Build cover image URL for reels
    let coverImageUrl: string | undefined
    if (publication.coverImagePath) {
      coverImageUrl = `${baseUrl}/${publication.coverImagePath}`
    }

    // Try to publish via Late API with full content type support
    const result = await lateService.createInstagramPost({
      accountId: instagramAccount.id,
      contentType: publication.contentType || 'post',
      content: publication.caption,
      mediaItems,
      publishNow: true,
      shareReelToFeed: publication.shareToFeed,
      coverImageUrl,
    })

    if (result.success) {
      publication.status = 'published'
      publication.laterMediaId = result.postId || null
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
