import type { HttpContext } from '@adonisjs/core/http'
import ThematicCategory from '#models/thematic_category'
import { DEFAULT_THEMATIC_CATEGORIES } from '#models/thematic_category'
import string from '@adonisjs/core/helpers/string'

export default class ThematicCategoriesController {
  /**
   * List all thematic categories
   */
  async index({ inertia }: HttpContext) {
    const categories = await ThematicCategory.query()
      .withCount('missionTemplates')
      .orderBy('name', 'asc')

    return inertia.render('admin/categories/index', {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        icon: c.icon,
        isActive: c.isActive,
        templatesCount: Number(c.$extras.missionTemplates_count || 0),
      })),
    })
  }

  /**
   * Store new category
   */
  async store({ request, response }: HttpContext) {
    const name = request.input('name')?.trim()
    const icon = request.input('icon')?.trim() || null

    if (!name || name.length < 2) {
      return response.badRequest({ error: 'Nom requis (min 2 caractères)' })
    }

    // Generate slug from name
    const slug = string.slug(name, { lower: true })

    // Check if slug already exists
    const existing = await ThematicCategory.query().where('slug', slug).first()
    if (existing) {
      return response.badRequest({ error: 'Une catégorie avec ce nom existe déjà' })
    }

    const category = await ThematicCategory.create({
      name,
      slug,
      icon,
      isActive: true,
    })

    return response.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        isActive: category.isActive,
      },
    })
  }

  /**
   * Update category
   */
  async update({ params, request, response }: HttpContext) {
    const categoryId = Number(params.id)
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const category = await ThematicCategory.find(categoryId)
    if (!category) {
      return response.notFound({ error: 'Catégorie non trouvée' })
    }

    const name = request.input('name')?.trim()
    const icon = request.input('icon')?.trim() || null

    if (!name || name.length < 2) {
      return response.badRequest({ error: 'Nom requis (min 2 caractères)' })
    }

    // Generate new slug if name changed
    const newSlug = string.slug(name, { lower: true })
    if (newSlug !== category.slug) {
      const existing = await ThematicCategory.query().where('slug', newSlug).whereNot('id', categoryId).first()
      if (existing) {
        return response.badRequest({ error: 'Une catégorie avec ce nom existe déjà' })
      }
      category.slug = newSlug
    }

    category.name = name
    category.icon = icon
    await category.save()

    return response.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon,
        isActive: category.isActive,
      },
    })
  }

  /**
   * Toggle category active status
   */
  async toggleActive({ params, response }: HttpContext) {
    const categoryId = Number(params.id)
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const category = await ThematicCategory.find(categoryId)
    if (!category) {
      return response.notFound({ error: 'Catégorie non trouvée' })
    }

    category.isActive = !category.isActive
    await category.save()

    return response.json({ success: true, isActive: category.isActive })
  }

  /**
   * Delete category
   */
  async destroy({ params, response }: HttpContext) {
    const categoryId = Number(params.id)
    if (Number.isNaN(categoryId) || categoryId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const category = await ThematicCategory.query()
      .where('id', categoryId)
      .withCount('missionTemplates')
      .first()

    if (!category) {
      return response.notFound({ error: 'Catégorie non trouvée' })
    }

    const templatesCount = Number(category.$extras.missionTemplates_count || 0)
    if (templatesCount > 0) {
      return response.badRequest({
        error: `Cette catégorie est utilisée par ${templatesCount} template(s)`,
      })
    }

    await category.delete()

    return response.json({ success: true })
  }

  /**
   * Seed default categories (for initial setup)
   */
  async seed({ response }: HttpContext) {
    const created: string[] = []
    const skipped: string[] = []

    for (const cat of DEFAULT_THEMATIC_CATEGORIES) {
      const existing = await ThematicCategory.query().where('slug', cat.slug).first()
      if (existing) {
        skipped.push(cat.name)
        continue
      }

      await ThematicCategory.create({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        isActive: true,
      })
      created.push(cat.name)
    }

    return response.json({
      success: true,
      created,
      skipped,
      message: `${created.length} catégorie(s) créée(s), ${skipped.length} existante(s) ignorée(s)`,
    })
  }
}
