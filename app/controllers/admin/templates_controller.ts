import type { HttpContext } from '@adonisjs/core/http'
import MissionTemplate from '#models/mission_template'
import Strategy from '#models/strategy'
import Tutorial from '#models/tutorial'
import { createTemplateValidator, updateTemplateValidator } from '#validators/admin'

export default class TemplatesController {
  /**
   * List all mission templates (FR44)
   */
  async index({ inertia, request }: HttpContext) {
    const strategyFilter = request.input('strategy')

    let query = MissionTemplate.query()
      .preload('strategy')
      .preload('tutorial')
      .preload('requiredTutorial')
      .withCount('missions')
      .orderBy('strategy_id', 'asc')
      .orderBy('order', 'asc')

    if (strategyFilter) {
      query = query.where('strategy_id', strategyFilter)
    }

    const templates = await query

    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')

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
        missionsCount: Number(t.$extras.missions_count || 0),
      })),
      strategies: strategies.map((s) => ({
        id: s.id,
        name: s.name,
      })),
      currentFilter: strategyFilter || null,
    })
  }

  /**
   * Show create form
   */
  async create({ inertia }: HttpContext) {
    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')
    const tutorials = await Tutorial.query().where('is_active', true).orderBy('title', 'asc')

    return inertia.render('admin/templates/create', {
      strategies: strategies.map((s) => ({ id: s.id, name: s.name })),
      tutorials: tutorials.map((t) => ({ id: t.id, title: t.title })),
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
      .first()

    if (!template) {
      return inertia.render('admin/templates/not-found')
    }

    const strategies = await Strategy.query().where('is_active', true).orderBy('name', 'asc')
    const tutorials = await Tutorial.query().where('is_active', true).orderBy('title', 'asc')

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
      },
      strategies: strategies.map((s) => ({ id: s.id, name: s.name })),
      tutorials: tutorials.map((t) => ({ id: t.id, title: t.title })),
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
      return response.notFound({ error: 'Template non trouvé' })
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
      return response.notFound({ error: 'Template non trouvé' })
    }

    template.isActive = !template.isActive
    await template.save()

    return response.json({ success: true, isActive: template.isActive })
  }

  /**
   * Delete template
   */
  async destroy({ response, params }: HttpContext) {
    const template = await MissionTemplate.query()
      .where('id', params.id)
      .withCount('missions')
      .first()

    if (!template) {
      return response.notFound({ error: 'Template non trouvé' })
    }

    const missionsCount = Number(template.$extras.missions_count || 0)
    if (missionsCount > 0) {
      return response.badRequest({
        error: `Ce template est utilisé par ${missionsCount} mission(s)`,
      })
    }

    await template.delete()

    return response.json({ success: true })
  }
}
