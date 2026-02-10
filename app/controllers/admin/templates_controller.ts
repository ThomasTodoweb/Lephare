import type { HttpContext } from '@adonisjs/core/http'
import MissionTemplate from '#models/mission_template'
import Strategy from '#models/strategy'
import Tutorial from '#models/tutorial'
import ThematicCategory from '#models/thematic_category'
import ContentIdea from '#models/content_idea'
import { createTemplateValidator, updateTemplateValidator } from '#validators/admin'
import { cuid } from '@adonisjs/core/helpers'
import app from '@adonisjs/core/services/app'
import { promises as fs } from 'node:fs'

export default class TemplatesController {
  /**
   * List all mission templates (FR44)
   */
  async index({ inertia, request }: HttpContext) {
    const strategyFilter = request.input('strategy')
    const typeFilter = request.input('type')

    let query = MissionTemplate.query()
      .preload('strategy')
      .preload('tutorial')
      .preload('requiredTutorial')
      .preload('thematicCategory')
      .whereNot('type', 'tuto') // Les tutos sont gérés séparément dans /admin/tutorials
      .orderBy('strategy_id', 'asc')
      .orderBy('order', 'asc')

    if (strategyFilter) {
      query = query.where('strategy_id', strategyFilter)
    }

    if (typeFilter) {
      query = query.where('type', typeFilter)
    }

    const templates = await query

    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')
    const thematicCategories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    return inertia.render('admin/templates/index', {
      templates: templates.map((t) => ({
        id: t.id,
        strategyId: t.strategyId,
        strategyName: t.strategy?.name || 'N/A',
        type: t.type,
        title: t.title,
        contentIdea: t.contentIdea,
        order: t.order,
        isActive: t.isActive,
        tutorialId: t.tutorialId,
        tutorialTitle: t.tutorial?.title || null,
        requiredTutorialId: t.requiredTutorialId,
        requiredTutorialTitle: t.requiredTutorial?.title || null,
        thematicCategoryId: t.thematicCategoryId,
        thematicCategoryName: t.thematicCategory?.name || null,
        thematicCategoryIcon: t.thematicCategory?.icon || null,
        notificationTime: t.notificationTime,
      })),
      strategies: strategies.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      thematicCategories: thematicCategories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
      })),
      currentFilter: strategyFilter || null,
      currentTypeFilter: typeFilter || null,
    })
  }

  /**
   * Show create form
   */
  async create({ inertia }: HttpContext) {
    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')
    const tutorials = await Tutorial.query().where('is_active', true).orderBy('title', 'asc')
    const thematicCategories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    return inertia.render('admin/templates/create', {
      strategies: strategies.map((s) => ({ id: s.id, name: s.name })),
      tutorials: tutorials.map((t) => ({ id: t.id, title: t.title })),
      thematicCategories: thematicCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
    })
  }

  /**
   * Store new template with validation
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createTemplateValidator)

    // Get max order for this strategy if not provided
    let order = data.order
    if (!order) {
      const maxOrder = await MissionTemplate.query()
        .where('strategy_id', data.strategyId)
        .max('order as max')
        .first()
      order = (maxOrder?.$extras.max || 0) + 1
    }

    await MissionTemplate.create({
      strategyId: data.strategyId,
      type: data.type,
      title: data.title,
      contentIdea: data.contentIdea || '',
      order,
      isActive: data.isActive ?? true,
      tutorialId: data.tutorialId || null,
      requiredTutorialId: data.requiredTutorialId || null,
      thematicCategoryId: data.thematicCategoryId || null,
      notificationTime: data.notificationTime || null,
    })

    return response.redirect('/admin/templates')
  }

  /**
   * Show edit form
   */
  async edit({ inertia, params }: HttpContext) {
    const template = await MissionTemplate.query()
      .where('id', params.id)
      .preload('strategy')
      .preload('thematicCategory')
      .preload('contentIdeas')
      .first()

    if (!template) {
      return inertia.render('admin/templates/not-found')
    }

    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')
    const tutorials = await Tutorial.query().where('is_active', true).orderBy('title', 'asc')
    const thematicCategories = await ThematicCategory.query().where('is_active', true).orderBy('name', 'asc')

    // Get all available ideas (not linked to any template) for selection
    const availableIdeas = await ContentIdea.query()
      .where('is_active', true)
      .whereNull('mission_template_id')
      .whereNotNull('example_media_path')
      .orderBy('id', 'desc')

    return inertia.render('admin/templates/edit', {
      template: {
        id: template.id,
        strategyId: template.strategyId,
        type: template.type,
        title: template.title,
        contentIdea: template.contentIdea,
        order: template.order,
        isActive: template.isActive,
        tutorialId: template.tutorialId,
        requiredTutorialId: template.requiredTutorialId,
        thematicCategoryId: template.thematicCategoryId,
        coverImagePath: template.coverImagePath,
        useRandomIdeaBackground: template.useRandomIdeaBackground,
        notificationTime: template.notificationTime,
        ideas: template.contentIdeas.map((idea) => ({
          id: idea.id,
          suggestionText: idea.suggestionText,
          photoTips: idea.photoTips,
          isActive: idea.isActive,
          restaurantTags: idea.restaurantTags,
          exampleMediaPath: idea.exampleMediaPath,
          exampleMediaType: idea.exampleMediaType,
        })),
      },
      strategies: strategies.map((s) => ({ id: s.id, name: s.name })),
      tutorials: tutorials.map((t) => ({ id: t.id, title: t.title })),
      thematicCategories: thematicCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon })),
      availableIdeas: availableIdeas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        suggestionText: idea.suggestionText,
        exampleMediaPath: idea.exampleMediaPath,
        exampleMediaType: idea.exampleMediaType,
        contentTypes: idea.contentTypes,
        thematicCategoryIds: idea.thematicCategoryIds,
      })),
    })
  }

  /**
   * Update template with validation
   */
  async update({ request, response, params }: HttpContext) {
    const templateId = Number(params.id)
    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const template = await MissionTemplate.find(templateId)

    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    const data = await request.validateUsing(updateTemplateValidator)

    template.merge({
      strategyId: data.strategyId,
      type: data.type,
      title: data.title,
      contentIdea: data.contentIdea ?? '',
      order: data.order,
      isActive: data.isActive,
      tutorialId: data.tutorialId || null,
      requiredTutorialId: data.requiredTutorialId || null,
      thematicCategoryId: data.thematicCategoryId || null,
      useRandomIdeaBackground: data.useRandomIdeaBackground ?? false,
      notificationTime: data.notificationTime ?? null,
    })

    await template.save()

    return response.redirect('/admin/templates')
  }

  /**
   * Toggle template active status
   */
  async toggleActive({ response, params }: HttpContext) {
    const template = await MissionTemplate.find(params.id)

    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    template.isActive = !template.isActive
    await template.save()

    return response.json({ success: true, isActive: template.isActive })
  }

  /**
   * Delete template
   */
  async destroy({ response, params }: HttpContext) {
    const template = await MissionTemplate.find(params.id)

    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    await template.delete()

    return response.json({ success: true })
  }

  /**
   * Upload cover image for template
   */
  async uploadCoverImage({ request, response, params }: HttpContext) {
    const templateId = Number(params.id)
    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const template = await MissionTemplate.find(templateId)
    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    const coverImage = request.file('coverImage', {
      size: '10mb',
      extnames: ['jpg', 'jpeg', 'png', 'webp'],
    })

    if (!coverImage || !coverImage.isValid) {
      return response.badRequest({
        error: coverImage?.errors?.[0]?.message || 'Image invalide',
      })
    }

    // Delete old cover image if exists
    if (template.coverImagePath) {
      try {
        const oldPath = app.makePath(template.coverImagePath)
        await fs.unlink(oldPath)
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Save new cover image
    const fileName = `template_${template.id}_${cuid()}.${coverImage.extname}`
    const uploadPath = app.makePath('storage/uploads/templates')

    await fs.mkdir(uploadPath, { recursive: true })
    await coverImage.move(uploadPath, { name: fileName })
    template.coverImagePath = `storage/uploads/templates/${fileName}`

    await template.save()

    return response.json({
      success: true,
      coverImagePath: template.coverImagePath,
    })
  }

  /**
   * Remove cover image from template
   */
  async removeCoverImage({ response, params }: HttpContext) {
    const templateId = Number(params.id)
    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const template = await MissionTemplate.find(templateId)
    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    // Delete cover image file if exists
    if (template.coverImagePath) {
      try {
        const oldPath = app.makePath(template.coverImagePath)
        await fs.unlink(oldPath)
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    template.coverImagePath = null
    await template.save()

    return response.json({ success: true })
  }

  /**
   * Link an existing idea to a template
   */
  async linkIdea({ request, response, params }: HttpContext) {
    const templateId = Number(params.id)
    const ideaId = Number(request.input('ideaId'))

    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID mission invalide' })
    }
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID idée invalide' })
    }

    const template = await MissionTemplate.find(templateId)
    if (!template) {
      return response.notFound({ error: 'Mission non trouvée' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idée non trouvée' })
    }

    // Link the idea to the template
    idea.missionTemplateId = templateId
    await idea.save()

    return response.json({
      success: true,
      idea: {
        id: idea.id,
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
   * Unlink an idea from a template
   */
  async unlinkIdea({ response, params }: HttpContext) {
    const templateId = Number(params.id)
    const ideaId = Number(params.ideaId)

    if (Number.isNaN(templateId) || templateId <= 0) {
      return response.badRequest({ error: 'ID mission invalide' })
    }
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID idée invalide' })
    }

    const idea = await ContentIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idée non trouvée' })
    }

    if (idea.missionTemplateId !== templateId) {
      return response.badRequest({ error: 'Cette idée n\'est pas liée à cette mission' })
    }

    // Unlink the idea from the template
    idea.missionTemplateId = null
    await idea.save()

    return response.json({ success: true })
  }
}
