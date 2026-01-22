import type { HttpContext } from '@adonisjs/core/http'
import ContentIdea from '#models/content_idea'
import MissionTemplate from '#models/mission_template'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'node:fs/promises'

export default class ContentIdeasController {
  /**
   * List all content ideas for a template
   */
  async index({ params, response }: HttpContext) {
    const templateId = Number(params.templateId)
    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID de template invalide' })
    }

    const ideas = await ContentIdea.query()
      .where('mission_template_id', templateId)
      .orderBy('id', 'asc')

    return response.json({
      ideas: ideas.map((idea) => ({
        id: idea.id,
        missionTemplateId: idea.missionTemplateId,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
        restaurantTags: idea.restaurantTags,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
      })),
    })
  }

  /**
   * Create a new content idea for a template (with optional media upload)
   */
  async store({ request, response }: HttpContext) {
    // Handle multipart form data
    const missionTemplateId = Number(request.input('missionTemplateId'))
    const suggestionText = request.input('suggestionText')?.trim()
    const photoTips = request.input('photoTips')?.trim() || null
    const isActive = request.input('isActive') !== 'false'
    const restaurantTagsInput = request.input('restaurantTags')

    // Parse restaurant tags (can be JSON string or array)
    let restaurantTags = null
    if (restaurantTagsInput) {
      try {
        restaurantTags =
          typeof restaurantTagsInput === 'string'
            ? JSON.parse(restaurantTagsInput)
            : restaurantTagsInput
        if (Array.isArray(restaurantTags) && restaurantTags.length === 0) {
          restaurantTags = null
        }
      } catch {
        restaurantTags = null
      }
    }

    // Validate required fields
    if (!missionTemplateId || Number.isNaN(missionTemplateId)) {
      return response.badRequest({ error: 'ID de template requis' })
    }
    if (!suggestionText || suggestionText.length < 3) {
      return response.badRequest({ error: 'Texte de suggestion requis (min 3 caracteres)' })
    }

    // Verify template exists
    const template = await MissionTemplate.find(missionTemplateId)
    if (!template) {
      return response.notFound({ error: 'Template non trouve' })
    }

    // Handle media file upload
    let exampleMediaPath: string | null = null
    let exampleMediaType: 'image' | 'video' | null = null

    const mediaFile = request.file('exampleMedia', {
      size: '50mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'],
    })

    if (mediaFile && mediaFile.isValid) {
      const fileName = `idea_${cuid()}.${mediaFile.extname}`
      const uploadPath = app.makePath('storage/uploads/ideas')

      // Ensure directory exists
      await fs.mkdir(uploadPath, { recursive: true })

      await mediaFile.move(uploadPath, { name: fileName })
      exampleMediaPath = `storage/uploads/ideas/${fileName}`

      // Determine media type
      const videoExtensions = ['mp4', 'mov', 'webm']
      exampleMediaType = videoExtensions.includes(mediaFile.extname || '') ? 'video' : 'image'
    }

    const idea = await ContentIdea.create({
      missionTemplateId,
      suggestionText,
      photoTips,
      isActive,
      restaurantTags,
      exampleMediaPath,
      exampleMediaType,
    })

    return response.json({
      success: true,
      idea: {
        id: idea.id,
        missionTemplateId: idea.missionTemplateId,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
        restaurantTags: idea.restaurantTags,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
      },
    })
  }

  /**
   * Update a content idea (with optional media upload)
   */
  async update({ params, request, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idee non trouvee' })
    }

    // Handle multipart form data
    const suggestionText = request.input('suggestionText')?.trim()
    const photoTips = request.input('photoTips')?.trim() || null
    const isActiveInput = request.input('isActive')
    const restaurantTagsInput = request.input('restaurantTags')
    const removeMedia = request.input('removeMedia') === 'true'

    // Parse restaurant tags
    let restaurantTags = idea.restaurantTags
    if (restaurantTagsInput !== undefined) {
      try {
        restaurantTags =
          typeof restaurantTagsInput === 'string'
            ? JSON.parse(restaurantTagsInput)
            : restaurantTagsInput
        if (Array.isArray(restaurantTags) && restaurantTags.length === 0) {
          restaurantTags = null
        }
      } catch {
        restaurantTags = null
      }
    }

    // Validate required fields
    if (!suggestionText || suggestionText.length < 3) {
      return response.badRequest({ error: 'Texte de suggestion requis (min 3 caracteres)' })
    }

    // Handle media removal
    if (removeMedia && idea.exampleMediaPath) {
      try {
        const fullPath = app.makePath(idea.exampleMediaPath)
        await fs.unlink(fullPath)
      } catch {
        // Ignore file deletion errors
      }
      idea.exampleMediaPath = null
      idea.exampleMediaType = null
    }

    // Handle new media file upload
    const mediaFile = request.file('exampleMedia', {
      size: '50mb',
      extnames: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov', 'webm'],
    })

    if (mediaFile && mediaFile.isValid) {
      // Delete old media if exists
      if (idea.exampleMediaPath) {
        try {
          const fullPath = app.makePath(idea.exampleMediaPath)
          await fs.unlink(fullPath)
        } catch {
          // Ignore file deletion errors
        }
      }

      const fileName = `idea_${cuid()}.${mediaFile.extname}`
      const uploadPath = app.makePath('storage/uploads/ideas')

      await fs.mkdir(uploadPath, { recursive: true })
      await mediaFile.move(uploadPath, { name: fileName })

      idea.exampleMediaPath = `storage/uploads/ideas/${fileName}`
      const videoExtensions = ['mp4', 'mov', 'webm']
      idea.exampleMediaType = videoExtensions.includes(mediaFile.extname || '') ? 'video' : 'image'
    }

    idea.merge({
      suggestionText,
      photoTips,
      isActive: isActiveInput !== undefined ? isActiveInput !== 'false' : idea.isActive,
      restaurantTags,
    })

    await idea.save()

    return response.json({
      success: true,
      idea: {
        id: idea.id,
        missionTemplateId: idea.missionTemplateId,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
        restaurantTags: idea.restaurantTags,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
      },
    })
  }

  /**
   * Toggle idea active status
   */
  async toggleActive({ params, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idee non trouvee' })
    }

    idea.isActive = !idea.isActive
    await idea.save()

    return response.json({ success: true, isActive: idea.isActive })
  }

  /**
   * Delete a content idea
   */
  async destroy({ params, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idee non trouvee' })
    }

    // Delete media file if exists
    if (idea.exampleMediaPath) {
      try {
        const fullPath = app.makePath(idea.exampleMediaPath)
        await fs.unlink(fullPath)
      } catch {
        // Ignore file deletion errors
      }
    }

    await idea.delete()

    return response.json({ success: true })
  }
}
