import type { HttpContext } from '@adonisjs/core/http'
import Strategy from '#models/strategy'
import { DateTime } from 'luxon'

export default class StrategiesController {
  /**
   * List all strategies (FR41)
   */
  async index({ inertia }: HttpContext) {
    const strategies = await Strategy.query()
      .withCount('restaurants')
      .withCount('missionTemplates')
      .orderBy('created_at', 'asc')

    return inertia.render('admin/strategies/index', {
      strategies: strategies.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        icon: s.icon,
        isActive: s.isActive,
        restaurantsCount: Number(s.$extras.restaurants_count || 0),
        templatesCount: Number(s.$extras.missionTemplates_count || 0),
        createdAt: s.createdAt.toISO(),
      })),
    })
  }

  /**
   * Show create form
   */
  async create({ inertia }: HttpContext) {
    return inertia.render('admin/strategies/create')
  }

  /**
   * Store new strategy
   */
  async store({ request, response }: HttpContext) {
    const data = request.only(['name', 'slug', 'description', 'icon', 'isActive'])

    // Validate slug uniqueness
    const existing = await Strategy.findBy('slug', data.slug)
    if (existing) {
      return response.badRequest({ error: 'Ce slug est déjà utilisé' })
    }

    await Strategy.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon || '📌',
      isActive: data.isActive ?? true,
    })

    return response.redirect('/admin/strategies')
  }

  /**
   * Show edit form
   */
  async edit({ inertia, params }: HttpContext) {
    const strategy = await Strategy.find(params.id)

    if (!strategy) {
      return inertia.render('admin/strategies/not-found')
    }

    return inertia.render('admin/strategies/edit', {
      strategy: {
        id: strategy.id,
        name: strategy.name,
        slug: strategy.slug,
        description: strategy.description,
        icon: strategy.icon,
        isActive: strategy.isActive,
      },
    })
  }

  /**
   * Update strategy
   */
  async update({ request, response, params }: HttpContext) {
    const strategy = await Strategy.find(params.id)

    if (!strategy) {
      return response.notFound({ error: 'Stratégie non trouvée' })
    }

    const data = request.only(['name', 'slug', 'description', 'icon', 'isActive'])

    // Validate slug uniqueness (except for current strategy)
    if (data.slug !== strategy.slug) {
      const existing = await Strategy.findBy('slug', data.slug)
      if (existing) {
        return response.badRequest({ error: 'Ce slug est déjà utilisé' })
      }
    }

    strategy.merge({
      name: data.name,
      slug: data.slug,
      description: data.description,
      icon: data.icon,
      isActive: data.isActive,
      updatedAt: DateTime.utc(),
    })

    await strategy.save()

    return response.redirect('/admin/strategies')
  }

  /**
   * Toggle strategy active status
   */
  async toggleActive({ response, params }: HttpContext) {
    const strategy = await Strategy.find(params.id)

    if (!strategy) {
      return response.notFound({ error: 'Stratégie non trouvée' })
    }

    strategy.isActive = !strategy.isActive
    await strategy.save()

    return response.json({ success: true, isActive: strategy.isActive })
  }

  /**
   * Delete strategy (only if no restaurants use it)
   */
  async destroy({ response, params }: HttpContext) {
    const strategy = await Strategy.query()
      .where('id', params.id)
      .withCount('restaurants')
      .first()

    if (!strategy) {
      return response.notFound({ error: 'Stratégie non trouvée' })
    }

    const restaurantsCount = Number(strategy.$extras.restaurants_count || 0)
    if (restaurantsCount > 0) {
      return response.badRequest({
        error: `Cette stratégie est utilisée par ${restaurantsCount} restaurant(s)`,
      })
    }

    await strategy.delete()

    return response.json({ success: true })
  }
}
