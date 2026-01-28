import type { HttpContext } from '@adonisjs/core/http'
import LevelThreshold from '#models/level_threshold'
import XpAction from '#models/xp_action'
import vine from '@vinejs/vine'

const levelValidator = vine.compile(
  vine.object({
    level: vine.number().positive(),
    xpRequired: vine.number().min(0),
    name: vine.string().trim().maxLength(50).optional(),
    icon: vine.string().trim().maxLength(10).optional(),
  })
)

const xpActionValidator = vine.compile(
  vine.object({
    xpAmount: vine.number().min(0),
    description: vine.string().trim().maxLength(255).optional(),
    isActive: vine.boolean().optional(),
  })
)

export default class LevelsController {
  /**
   * List all levels and XP actions
   */
  async index({ inertia }: HttpContext) {
    const levels = await LevelThreshold.query().orderBy('level', 'asc')
    const xpActions = await XpAction.query().orderBy('xp_amount', 'desc')

    return inertia.render('admin/levels/index', {
      levels: levels.map((l) => ({
        id: l.id,
        level: l.level,
        xpRequired: l.xpRequired,
        name: l.name,
        icon: l.icon,
      })),
      xpActions: xpActions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        xpAmount: a.xpAmount,
        description: a.description,
        isActive: a.isActive,
      })),
    })
  }

  /**
   * Update a level threshold
   */
  async updateLevel({ request, response, params }: HttpContext) {
    const id = Number(params.id)
    const level = await LevelThreshold.find(id)

    if (!level) {
      return response.notFound({ error: 'Niveau introuvable' })
    }

    const data = await request.validateUsing(levelValidator)

    level.merge({
      level: data.level,
      xpRequired: data.xpRequired,
      name: data.name || null,
      icon: data.icon || null,
    })
    await level.save()

    return response.json({ success: true, level })
  }

  /**
   * Create a new level
   */
  async storeLevel({ request, response }: HttpContext) {
    const data = await request.validateUsing(levelValidator)

    // Check if level number already exists
    const existing = await LevelThreshold.findBy('level', data.level)
    if (existing) {
      return response.badRequest({ error: 'Ce numéro de niveau existe déjà' })
    }

    const level = await LevelThreshold.create({
      level: data.level,
      xpRequired: data.xpRequired,
      name: data.name || null,
      icon: data.icon || null,
    })

    return response.json({ success: true, level })
  }

  /**
   * Delete a level
   */
  async destroyLevel({ response, params }: HttpContext) {
    const id = Number(params.id)
    const level = await LevelThreshold.find(id)

    if (!level) {
      return response.notFound({ error: 'Niveau introuvable' })
    }

    // Don't allow deleting level 1
    if (level.level === 1) {
      return response.badRequest({ error: 'Le niveau 1 ne peut pas être supprimé' })
    }

    await level.delete()

    return response.json({ success: true })
  }

  /**
   * Update an XP action
   */
  async updateXpAction({ request, response, params }: HttpContext) {
    const id = Number(params.id)
    const action = await XpAction.find(id)

    if (!action) {
      return response.notFound({ error: 'Action introuvable' })
    }

    const data = await request.validateUsing(xpActionValidator)

    action.merge({
      xpAmount: data.xpAmount,
      description: data.description || null,
      isActive: data.isActive ?? action.isActive,
    })
    await action.save()

    return response.json({ success: true, action })
  }
}
