import type { HttpContext } from '@adonisjs/core/http'
import Tutorial from '#models/tutorial'
import TutorialCategory from '#models/tutorial_category'
import { createTutorialValidator, updateTutorialValidator } from '#validators/admin'

export default class TutorialsController {
  /**
   * List all tutorials (FR46)
   */
  async index({ inertia, request }: HttpContext) {
    const rawCategoryFilter = request.input('category')
    const categoryFilter = rawCategoryFilter ? Number(rawCategoryFilter) : null

    let query = Tutorial.query()
      .preload('category')
      .withCount('completions')
      .orderBy('category_id', 'asc')
      .orderBy('order', 'asc')

    if (categoryFilter && !Number.isNaN(categoryFilter) && categoryFilter > 0) {
      query = query.where('category_id', categoryFilter)
    }

    const tutorials = await query

    const categories = await TutorialCategory.query()
      .where('is_active', true)
      .orderBy('order', 'asc')

    return inertia.render('admin/tutorials/index', {
      tutorials: tutorials.map((t) => ({
        id: t.id,
        categoryId: t.categoryId,
        categoryName: t.category?.name || 'N/A',
        title: t.title,
        description: t.description,
        videoUrl: t.videoUrl,
        durationMinutes: t.durationMinutes,
        order: t.order,
        isActive: t.isActive,
        completionsCount: Number(t.$extras.completions_count || 0),
      })),
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
      })),
      currentFilter: categoryFilter || null,
    })
  }

  /**
   * Show create form
   */
  async create({ inertia }: HttpContext) {
    const categories = await TutorialCategory.query()
      .where('is_active', true)
      .orderBy('order', 'asc')

    return inertia.render('admin/tutorials/create', {
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
    })
  }

  /**
   * Store new tutorial with validation
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createTutorialValidator)

    // Get max order for this category if not provided
    let order = data.order
    if (!order) {
      const maxOrder = await Tutorial.query()
        .where('category_id', data.categoryId)
        .max('order as max')
        .first()
      order = (maxOrder?.$extras.max || 0) + 1
    }

    await Tutorial.create({
      categoryId: data.categoryId,
      title: data.title,
      description: data.description || null,
      videoUrl: data.videoUrl || null,
      contentText: data.contentText || null,
      durationMinutes: data.durationMinutes || 5,
      order,
      isActive: data.isActive ?? true,
    })

    return response.redirect('/admin/tutorials')
  }

  /**
   * Show edit form
   */
  async edit({ inertia, params }: HttpContext) {
    const tutorialId = Number(params.id)
    if (Number.isNaN(tutorialId) || tutorialId <= 0) {
      return inertia.render('admin/tutorials/not-found')
    }

    const tutorial = await Tutorial.query().where('id', tutorialId).preload('category').first()

    if (!tutorial) {
      return inertia.render('admin/tutorials/not-found')
    }

    const categories = await TutorialCategory.query()
      .where('is_active', true)
      .orderBy('order', 'asc')

    return inertia.render('admin/tutorials/edit', {
      tutorial: {
        id: tutorial.id,
        categoryId: tutorial.categoryId,
        title: tutorial.title,
        description: tutorial.description,
        videoUrl: tutorial.videoUrl,
        contentText: tutorial.contentText,
        durationMinutes: tutorial.durationMinutes,
        order: tutorial.order,
        isActive: tutorial.isActive,
      },
      categories: categories.map((c) => ({ id: c.id, name: c.name })),
    })
  }

  /**
   * Update tutorial with validation
   */
  async update({ request, response, params }: HttpContext) {
    const tutorialId = Number(params.id)
    if (Number.isNaN(tutorialId) || tutorialId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const tutorial = await Tutorial.find(tutorialId)

    if (!tutorial) {
      return response.notFound({ error: 'Tutoriel non trouvé' })
    }

    const data = await request.validateUsing(updateTutorialValidator)

    tutorial.merge({
      categoryId: data.categoryId,
      title: data.title,
      description: data.description ?? null,
      videoUrl: data.videoUrl ?? null,
      contentText: data.contentText ?? null,
      durationMinutes: data.durationMinutes,
      order: data.order,
      isActive: data.isActive,
    })

    await tutorial.save()

    return response.redirect('/admin/tutorials')
  }

  /**
   * Toggle tutorial active status
   */
  async toggleActive({ response, params }: HttpContext) {
    const tutorialId = Number(params.id)
    if (Number.isNaN(tutorialId) || tutorialId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const tutorial = await Tutorial.find(tutorialId)

    if (!tutorial) {
      return response.notFound({ error: 'Tutoriel non trouvé' })
    }

    tutorial.isActive = !tutorial.isActive
    await tutorial.save()

    return response.json({ success: true, isActive: tutorial.isActive })
  }

  /**
   * Delete tutorial
   */
  async destroy({ response, params }: HttpContext) {
    const tutorialId = Number(params.id)
    if (Number.isNaN(tutorialId) || tutorialId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const tutorial = await Tutorial.query()
      .where('id', tutorialId)
      .withCount('completions')
      .first()

    if (!tutorial) {
      return response.notFound({ error: 'Tutoriel non trouvé' })
    }

    const completionsCount = Number(tutorial.$extras.completions_count || 0)
    if (completionsCount > 0) {
      return response.badRequest({
        error: `Ce tutoriel a été complété ${completionsCount} fois. Vous ne pouvez pas le supprimer.`,
      })
    }

    await tutorial.delete()

    return response.json({ success: true })
  }
}
