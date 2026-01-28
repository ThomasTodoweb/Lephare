import type { HttpContext } from '@adonisjs/core/http'
import ContentIdea from '#models/content_idea'
import ThematicCategory from '#models/thematic_category'
import app from '@adonisjs/core/services/app'
import { cuid } from '@adonisjs/core/helpers'
import fs from 'node:fs/promises'

export default class IdeasController {
  /**
   * List all content ideas (standalone, not nested under templates)
   */
  async index({ inertia, request }: HttpContext) {
    const contentTypeFilter = request.input('contentType')
    const categoryFilter = request.input('category')

    let query = ContentIdea.query().orderBy('id', 'desc')

    const ideas = await query

    // Filter in memory for JSON columns
    let filteredIdeas = ideas
    if (contentTypeFilter) {
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.contentTypes && idea.contentTypes.includes(contentTypeFilter)
      )
    }
    if (categoryFilter) {
      const catId = Number(categoryFilter)
      filteredIdeas = filteredIdeas.filter(
        (idea) => idea.thematicCategoryIds && idea.thematicCategoryIds.includes(catId)
      )
    }

    const categories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    return inertia.render('admin/ideas/index', {
      ideas: filteredIdeas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
        restaurantTags: idea.restaurantTags,
        contentTypes: idea.contentTypes,
        thematicCategoryIds: idea.thematicCategoryIds,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })),
      filters: {
        contentType: contentTypeFilter || null,
        category: categoryFilter || null,
      },
    })
  }

  /**
   * Show create form
   */
  async create({ inertia }: HttpContext) {
    const categories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    return inertia.render('admin/ideas/create', {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })),
    })
  }

  /**
   * Store new idea (with optional media upload)
   */
  async store({ request, response, session }: HttpContext) {
    const title = request.input('title')?.trim() || null
    const suggestionText = request.input('suggestionText')?.trim()
    const photoTips = request.input('photoTips')?.trim() || null
    const isActive = request.input('isActive') !== 'false'
    const restaurantTagsInput = request.input('restaurantTags')
    const contentTypesInput = request.input('contentTypes')
    const thematicCategoryIdsInput = request.input('thematicCategoryIds')

    // Validate required fields
    if (!suggestionText || suggestionText.length < 3) {
      session.flash('errors', { suggestionText: 'Description requise (min 3 caractères)' })
      return response.redirect().back()
    }

    // Parse JSON arrays
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

    let contentTypes = null
    if (contentTypesInput) {
      try {
        contentTypes =
          typeof contentTypesInput === 'string' ? JSON.parse(contentTypesInput) : contentTypesInput
        if (Array.isArray(contentTypes) && contentTypes.length === 0) {
          contentTypes = null
        }
      } catch {
        contentTypes = null
      }
    }

    let thematicCategoryIds = null
    if (thematicCategoryIdsInput) {
      try {
        thematicCategoryIds =
          typeof thematicCategoryIdsInput === 'string'
            ? JSON.parse(thematicCategoryIdsInput)
            : thematicCategoryIdsInput
        if (Array.isArray(thematicCategoryIds) && thematicCategoryIds.length === 0) {
          thematicCategoryIds = null
        }
      } catch {
        thematicCategoryIds = null
      }
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

      await fs.mkdir(uploadPath, { recursive: true })
      await mediaFile.move(uploadPath, { name: fileName })
      exampleMediaPath = `storage/uploads/ideas/${fileName}`

      const videoExtensions = ['mp4', 'mov', 'webm']
      exampleMediaType = videoExtensions.includes(mediaFile.extname || '') ? 'video' : 'image'
    }

    await ContentIdea.create({
      title,
      suggestionText,
      photoTips,
      isActive,
      restaurantTags,
      contentTypes,
      thematicCategoryIds,
      exampleMediaPath,
      exampleMediaType,
      missionTemplateId: null, // Not linked to specific template
    })

    return response.redirect('/admin/ideas')
  }

  /**
   * Show edit form
   */
  async edit({ params, inertia, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return inertia.render('admin/ideas/not-found')
    }

    const categories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    return inertia.render('admin/ideas/edit', {
      idea: {
        id: idea.id,
        title: idea.title,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
        restaurantTags: idea.restaurantTags,
        contentTypes: idea.contentTypes,
        thematicCategoryIds: idea.thematicCategoryIds,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
      },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
      })),
    })
  }

  /**
   * Update idea (with optional media upload)
   */
  async update({ params, request, response, session }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      session.flash('errors', { id: 'ID invalide' })
      return response.redirect().back()
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      session.flash('errors', { id: 'Idée non trouvée' })
      return response.redirect().back()
    }

    const title = request.input('title')?.trim() || null
    const suggestionText = request.input('suggestionText')?.trim()
    const photoTips = request.input('photoTips')?.trim() || null
    const isActiveInput = request.input('isActive')
    const restaurantTagsInput = request.input('restaurantTags')
    const contentTypesInput = request.input('contentTypes')
    const thematicCategoryIdsInput = request.input('thematicCategoryIds')
    const removeMedia = request.input('removeMedia') === 'true'

    // Validate required fields
    if (!suggestionText || suggestionText.length < 3) {
      session.flash('errors', { suggestionText: 'Description requise (min 3 caractères)' })
      return response.redirect().back()
    }

    // Parse JSON arrays
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

    let contentTypes = idea.contentTypes
    if (contentTypesInput !== undefined) {
      try {
        contentTypes =
          typeof contentTypesInput === 'string' ? JSON.parse(contentTypesInput) : contentTypesInput
        if (Array.isArray(contentTypes) && contentTypes.length === 0) {
          contentTypes = null
        }
      } catch {
        contentTypes = null
      }
    }

    let thematicCategoryIds = idea.thematicCategoryIds
    if (thematicCategoryIdsInput !== undefined) {
      try {
        thematicCategoryIds =
          typeof thematicCategoryIdsInput === 'string'
            ? JSON.parse(thematicCategoryIdsInput)
            : thematicCategoryIdsInput
        if (Array.isArray(thematicCategoryIds) && thematicCategoryIds.length === 0) {
          thematicCategoryIds = null
        }
      } catch {
        thematicCategoryIds = null
      }
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
      title,
      suggestionText,
      photoTips,
      isActive: isActiveInput !== undefined ? isActiveInput !== 'false' : idea.isActive,
      restaurantTags,
      contentTypes,
      thematicCategoryIds,
    })

    await idea.save()

    return response.redirect('/admin/ideas')
  }

  /**
   * Toggle idea active status
   */
  async toggleActive({ params, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.redirect().back()
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.redirect().back()
    }

    idea.isActive = !idea.isActive
    await idea.save()

    return response.redirect().back()
  }

  /**
   * Delete idea
   */
  async destroy({ params, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.redirect().back()
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.redirect().back()
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

    return response.redirect('/admin/ideas')
  }
}
