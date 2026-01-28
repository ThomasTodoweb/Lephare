import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import { DateTime } from 'luxon'
import { readFile, unlink, access } from 'node:fs/promises'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import Mission from '#models/mission'
import Publication, { type ContentType, type PublicationMediaItem } from '#models/publication'
import Restaurant from '#models/restaurant'
import ContentIdea from '#models/content_idea'
import MissionService from '#services/mission_service'
import AIService from '#services/ai_service'
import LateService, { type MediaItem } from '#services/late_service'

const MAX_CAPTION_LENGTH = 2200 // Instagram's limit
const execAsync = promisify(exec)

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
      .preload('missionTemplate', (query) => {
        query.preload('thematicCategory').preload('tutorial')
      })
      .first()

    if (!mission) {
      return inertia.render('errors/not_found')
    }

    // Get user's restaurant type for filtering ideas
    const restaurant = await Restaurant.query().where('user_id', user.id).first()
    const userRestaurantType = restaurant?.type || null

    // Determine content type from mission template
    const contentType = MISSION_TYPE_TO_CONTENT_TYPE[mission.missionTemplate.type] || 'post'

    // Get thematic category ID from mission template
    const thematicCategoryId = mission.missionTemplate.thematicCategoryId

    // Load all active ideas (new system: ideas are standalone, not linked to templates)
    const allIdeas = await ContentIdea.query().where('is_active', true)

    // Filter ideas by:
    // 1. Content type (post, story, reel, carousel)
    // 2. Thematic category (if mission template has one)
    // 3. Restaurant type (if user has one)
    const matchingIdeas = allIdeas.filter((idea) => {
      // Check content type match
      if (!idea.matchesContentType(mission.missionTemplate.type)) {
        return false
      }

      // Check thematic category match
      if (!idea.matchesThematicCategory(thematicCategoryId)) {
        return false
      }

      // Check restaurant type match
      if (!idea.matchesRestaurantType(userRestaurantType)) {
        return false
      }

      return true
    })

    // Check if media files actually exist for each idea
    const filteredIdeasWithFileCheck = await Promise.all(
      matchingIdeas.map(async (idea) => {
        // If idea has a media path, verify the file exists
        if (idea.exampleMediaPath) {
          try {
            await access(app.makePath(idea.exampleMediaPath))
            return { idea, mediaExists: true } // File exists
          } catch {
            // File doesn't exist
            return { idea, mediaExists: false }
          }
        }
        return { idea, mediaExists: false } // No media path
      })
    )

    // Include ideas: those with valid media, OR those without media (text-only ideas)
    const filteredIdeas = filteredIdeasWithFileCheck
      .filter(({ idea, mediaExists }) => mediaExists || !idea.exampleMediaPath)
      .map(({ idea }) => idea)

    // Render the new mission page (step 1/3)
    return inertia.render('publications/mission', {
      mission: {
        id: mission.id,
        template: {
          type: mission.missionTemplate.type,
          title: mission.missionTemplate.title,
          contentIdea: mission.missionTemplate.contentIdea,
          thematicCategory: mission.missionTemplate.thematicCategory
            ? {
                id: mission.missionTemplate.thematicCategory.id,
                name: mission.missionTemplate.thematicCategory.name,
                icon: mission.missionTemplate.thematicCategory.icon,
              }
            : null,
          ideas: filteredIdeas.map((idea) => ({
            id: idea.id,
            title: idea.title,
            suggestionText: idea.suggestionText,
            photoTips: idea.photoTips,
            exampleMediaPath: idea.exampleMediaPath,
            exampleMediaType: idea.exampleMediaType,
          })),
          linkedTutorial: mission.missionTemplate.tutorial
            ? {
                id: mission.missionTemplate.tutorial.id,
                title: mission.missionTemplate.tutorial.title,
              }
            : null,
        },
      },
      contentType,
      maxImages: contentType === 'carousel' ? 10 : 1,
      acceptVideo: contentType === 'reel' || contentType === 'story',
      totalSteps: 3,
      currentStep: 1,
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

    // Get selected content idea ID if provided
    const contentIdeaIdInput = request.input('contentIdeaId')
    const contentIdeaId = contentIdeaIdInput ? Number(contentIdeaIdInput) : null

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
        contentIdeaId,
      })

      return response.redirect().toRoute('publications.analysis', { id: publication.id })
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
        contentIdeaId,
      })

      return response.redirect().toRoute('publications.analysis', { id: publication.id })
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
      contentIdeaId,
    })

    return response.redirect().toRoute('publications.analysis', { id: publication.id })
  }

  /**
   * Show analysis page - AI evaluates media quality
   */
  async analysis({ inertia, auth, params }: HttpContext) {
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

    // Stories have only 2 steps (no description step)
    const isStory = publication.contentType === 'story'
    const totalSteps = isStory ? 2 : 3

    return inertia.render('publications/analysis', {
      publication: {
        id: publication.id,
        imagePath: publication.imagePath,
        contentType: publication.contentType || 'post',
        mediaItems: publication.mediaItems || [],
        qualityScore: publication.qualityScore,
        qualityFeedback: publication.qualityFeedback,
      },
      mission: publication.mission
        ? {
            id: publication.mission.id,
            template: {
              title: publication.mission.missionTemplate.title,
              type: publication.mission.missionTemplate.type,
              tutorialId: publication.mission.missionTemplate.tutorialId,
            },
          }
        : null,
      totalSteps,
      currentStep: 2,
      skipDescription: isStory, // Tell frontend to skip description step
    })
  }

  /**
   * Run AI quality analysis on the media
   */
  async runAnalysis({ response, auth, params }: HttpContext) {
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
      return response.status(404).json({ error: 'Publication introuvable' })
    }

    // If already analyzed, return cached result
    if (publication.qualityScore) {
      return response.json({
        score: publication.qualityScore,
        feedback: publication.qualityFeedback,
      })
    }

    // Load restaurant info for relevance check
    const restaurant = await Restaurant.query()
      .where('user_id', user.id)
      .first()

    // Get mission context for coherence check
    const missionTitle = publication.mission?.missionTemplate?.title
    const missionTheme = publication.mission?.missionTemplate?.contentIdea

    // Read the image for analysis
    let imageBase64: string | undefined
    let imageMimeType: string | undefined

    try {
      const isVideo = publication.mediaItems?.[0]?.type === 'video' ||
        publication.contentType === 'reel'

      if (isVideo) {
        // For videos, extract multiple frames for better analysis
        const thumbnailPaths: string[] = []

        try {
          const videoPath = app.makePath(publication.imagePath)

          // Get video duration
          let duration = 5 // Default 5 seconds if we can't get duration
          try {
            const { stdout } = await execAsync(
              `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
            )
            duration = Math.max(1, parseFloat(stdout.trim()) || 5)
          } catch {
            // Use default duration
          }

          // Extract 3 frames: start (10%), middle (50%), end (80%)
          const framePositions = [
            Math.max(0.5, duration * 0.1),
            duration * 0.5,
            Math.min(duration - 0.5, duration * 0.8),
          ]

          for (let i = 0; i < framePositions.length; i++) {
            const pos = framePositions[i]
            const thumbPath = app.makePath(`storage/uploads/thumb_${cuid()}_${i}.jpg`)
            thumbnailPaths.push(thumbPath)

            await execAsync(
              `ffmpeg -i "${videoPath}" -ss ${pos.toFixed(2)} -vframes 1 -q:v 2 "${thumbPath}" -y 2>/dev/null || ` +
                `ffmpeg -i "${videoPath}" -vframes 1 -q:v 2 "${thumbPath}" -y`
            )
          }

          // Read all frames for analysis
          const framesBase64: string[] = []
          for (const thumbPath of thumbnailPaths) {
            try {
              const thumbBuffer = await readFile(thumbPath)
              framesBase64.push(thumbBuffer.toString('base64'))
            } catch {
              // Skip failed frames
            }
          }

          // Cleanup thumbnails
          for (const thumbPath of thumbnailPaths) {
            unlink(thumbPath).catch(() => {})
          }

          if (framesBase64.length === 0) {
            throw new Error('No frames extracted')
          }

          // Use multiple frames for analysis
          const aiService = new AIService()
          const result = await aiService.analyzeVideoQuality(
            framesBase64,
            'image/jpeg',
            publication.contentType === 'story' ? 'story' : 'reel',
            restaurant?.name,
            restaurant?.type,
            missionTitle,
            missionTheme
          )

          publication.qualityScore = result.score
          publication.qualityFeedback = result.feedback
          publication.qualityAnalyzedAt = DateTime.now()
          await publication.save()

          return response.json({
            score: result.score,
            feedback: result.feedback,
          })
        } catch (ffmpegError) {
          console.error('Failed to extract video frames:', ffmpegError)
          publication.qualityScore = 'green'
          publication.qualityFeedback = 'Ta vidéo est prête !'
          publication.qualityAnalyzedAt = DateTime.now()
          await publication.save()

          // Cleanup any partial thumbnails
          for (const thumbPath of thumbnailPaths) {
            unlink(thumbPath).catch(() => {})
          }

          return response.json({
            score: publication.qualityScore,
            feedback: publication.qualityFeedback,
          })
        }
      } else {
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
        } else {
          imageMimeType = 'image/jpeg' // Default
        }
      }
    } catch (error) {
      console.error('Failed to read image for quality analysis:', error)
      // Default to green if we can't read the file
      publication.qualityScore = 'green'
      publication.qualityFeedback = 'Analyse non disponible, vous pouvez continuer.'
      publication.qualityAnalyzedAt = DateTime.now()
      await publication.save()

      return response.json({
        score: publication.qualityScore,
        feedback: publication.qualityFeedback,
      })
    }

    // Run AI analysis
    const aiService = new AIService()
    const result = await aiService.analyzeMediaQuality(
      imageBase64!,
      imageMimeType!,
      publication.contentType || 'post',
      restaurant?.name,
      restaurant?.type,
      missionTitle,
      missionTheme
    )

    // Save result
    publication.qualityScore = result.score
    publication.qualityFeedback = result.feedback
    publication.qualityAnalyzedAt = DateTime.now()
    await publication.save()

    return response.json({
      score: result.score,
      feedback: result.feedback,
    })
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

      // Try to read the media for vision analysis
      let imageBase64: string | undefined
      let imageMimeType: string | undefined

      const isVideo =
        publication.contentType === 'reel' ||
        publication.mediaItems?.[0]?.type === 'video'

      try {
        if (isVideo) {
          // For videos, extract a frame using ffmpeg
          const videoPath = app.makePath(publication.imagePath)
          const thumbPath = app.makePath(`storage/uploads/thumb_desc_${cuid()}.jpg`)

          try {
            // Get video duration and extract a frame at 30% to avoid intro
            let position = 1
            try {
              const { stdout } = await execAsync(
                `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
              )
              const duration = parseFloat(stdout.trim()) || 5
              position = Math.max(0.5, duration * 0.3)
            } catch {
              // Use default position
            }

            await execAsync(
              `ffmpeg -i "${videoPath}" -ss ${position.toFixed(2)} -vframes 1 -q:v 2 "${thumbPath}" -y 2>/dev/null || ` +
                `ffmpeg -i "${videoPath}" -vframes 1 -q:v 2 "${thumbPath}" -y`
            )

            const thumbBuffer = await readFile(thumbPath)
            imageBase64 = thumbBuffer.toString('base64')
            imageMimeType = 'image/jpeg'

            // Cleanup thumbnail
            unlink(thumbPath).catch(() => {})
          } catch (ffmpegError) {
            console.error('Failed to extract video frame for description:', ffmpegError)
          }
        } else {
          // For images, read directly
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
        }
      } catch (error) {
        console.error('Failed to read media for AI analysis:', error)
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
      totalSteps: 3,
      currentStep: 3,
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
