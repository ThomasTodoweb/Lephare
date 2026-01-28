import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import TutorialCategory from '#models/tutorial_category'
import Tutorial from '#models/tutorial'
import TutorialCompletion from '#models/tutorial_completion'
import MissionService from '#services/mission_service'

export default class TutorialsController {
  /**
   * List all tutorial categories with their tutorials
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const userLevel = user.currentLevel || 1

    const categories = await TutorialCategory.query()
      .where('is_active', true)
      .preload('tutorials', (query) => {
        query.where('is_active', true).orderBy('order', 'asc')
      })
      .orderBy('order', 'asc')

    // Get user's completed tutorials
    const completedTutorials = await TutorialCompletion.query()
      .where('user_id', user.id)
      .select('tutorial_id')

    const completedIds = completedTutorials.map((c) => c.tutorialId)

    return inertia.render('tutorials/index', {
      userLevel,
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        tutorials: cat.tutorials.map((tut) => ({
          id: tut.id,
          title: tut.title,
          description: tut.description,
          durationMinutes: tut.durationMinutes,
          requiredLevel: tut.requiredLevel || 1,
          isCompleted: completedIds.includes(tut.id),
          isLocked: (tut.requiredLevel || 1) > userLevel,
        })),
      })),
    })
  }

  /**
   * Escape LIKE wildcards to prevent SQL wildcard injection
   */
  private escapeLikeWildcards(value: string): string {
    return value.replace(/[%_]/g, '\\$&')
  }

  /**
   * Search tutorials
   */
  async search({ request, inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const userLevel = user.currentLevel || 1
    const query = request.input('q', '').trim()

    let tutorials: Tutorial[] = []

    if (query.length >= 2) {
      const escapedQuery = this.escapeLikeWildcards(query)
      tutorials = await Tutorial.query()
        .where('is_active', true)
        .where((builder) => {
          builder
            .whereILike('title', `%${escapedQuery}%`)
            .orWhereILike('description', `%${escapedQuery}%`)
        })
        .preload('category')
        .orderBy('order', 'asc')
        .limit(20)
    }

    // Get user's completed tutorials
    const completedTutorials = await TutorialCompletion.query()
      .where('user_id', user.id)
      .select('tutorial_id')

    const completedIds = completedTutorials.map((c) => c.tutorialId)

    return inertia.render('tutorials/search', {
      query,
      userLevel,
      tutorials: tutorials.map((tut) => ({
        id: tut.id,
        title: tut.title,
        description: tut.description,
        durationMinutes: tut.durationMinutes,
        categoryName: tut.category?.name,
        requiredLevel: tut.requiredLevel || 1,
        isCompleted: completedIds.includes(tut.id),
        isLocked: (tut.requiredLevel || 1) > userLevel,
      })),
    })
  }

  /**
   * Show tutorial detail
   */
  async show({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const userLevel = user.currentLevel || 1
    const tutorialId = Number(params.id)

    if (Number.isNaN(tutorialId)) {
      return inertia.render('errors/not_found')
    }

    const tutorial = await Tutorial.query()
      .where('id', tutorialId)
      .where('is_active', true)
      .preload('category')
      .first()

    if (!tutorial) {
      return inertia.render('errors/not_found')
    }

    // Check if tutorial is locked by level
    const requiredLevel = tutorial.requiredLevel || 1
    const isLocked = requiredLevel > userLevel
    if (isLocked) {
      return inertia.render('tutorials/locked', {
        tutorial: { id: tutorial.id, title: tutorial.title, requiredLevel },
        userLevel,
      })
    }

    // Check if user completed this tutorial
    const completion = await TutorialCompletion.query()
      .where('user_id', user.id)
      .where('tutorial_id', tutorialId)
      .first()

    return inertia.render('tutorials/show', {
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
        description: tutorial.description,
        videoUrl: tutorial.videoUrl,
        contentText: tutorial.contentText,
        durationMinutes: tutorial.durationMinutes,
        categoryName: tutorial.category?.name,
        categorySlug: tutorial.category?.slug,
      },
      isCompleted: !!completion,
      feedback: completion?.feedback || null,
    })
  }

  /**
   * Mark tutorial as completed
   */
  async complete({ response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const tutorialId = Number(params.id)

    if (Number.isNaN(tutorialId)) {
      session.flash('error', 'Tutoriel invalide')
      return response.redirect().toRoute('tutorials.index')
    }

    const tutorial = await Tutorial.query()
      .where('id', tutorialId)
      .where('is_active', true)
      .first()

    if (!tutorial) {
      session.flash('error', 'Tutoriel introuvable')
      return response.redirect().toRoute('tutorials.index')
    }

    // Check if already completed
    const existing = await TutorialCompletion.query()
      .where('user_id', user.id)
      .where('tutorial_id', tutorialId)
      .first()

    if (!existing) {
      await TutorialCompletion.create({
        userId: user.id,
        tutorialId: tutorial.id,
        completedAt: DateTime.utc(),
        feedback: null,
      })
    }

    // Check if this completes a tuto mission
    const missionService = new MissionService()
    const missionResult = await missionService.completeTutoMission(user.id, tutorialId)

    if (missionResult.success) {
      // Redirect to tutorial bravo page if a mission was completed
      session.flash('success', 'Tutoriel terminé et mission accomplie !')
      return response.redirect().toRoute('tutorials.bravo', { id: tutorialId })
    }

    session.flash('success', 'Tutoriel marqué comme vu !')
    return response.redirect().toRoute('tutorials.show', { id: tutorialId })
  }

  /**
   * Show bravo page for completed tutorial mission
   */
  async bravo({ inertia, auth, params }: HttpContext) {
    const user = auth.getUserOrFail()
    const tutorialId = Number(params.id)

    if (Number.isNaN(tutorialId)) {
      return inertia.render('errors/not_found')
    }

    const tutorial = await Tutorial.query()
      .where('id', tutorialId)
      .first()

    if (!tutorial) {
      return inertia.render('errors/not_found')
    }

    // Verify user completed this tutorial
    const completion = await TutorialCompletion.query()
      .where('user_id', user.id)
      .where('tutorial_id', tutorialId)
      .first()

    if (!completion) {
      return inertia.render('errors/not_found')
    }

    return inertia.render('tutorials/bravo', {
      tutorial: {
        id: tutorial.id,
        title: tutorial.title,
      },
    })
  }

  /**
   * Submit feedback for a tutorial
   */
  async feedback({ request, response, auth, params, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const tutorialId = Number(params.id)

    if (Number.isNaN(tutorialId)) {
      session.flash('error', 'Tutoriel invalide')
      return response.redirect().back()
    }
    const feedback = request.input('feedback') as 'useful' | 'not_useful'

    if (!['useful', 'not_useful'].includes(feedback)) {
      session.flash('error', 'Feedback invalide')
      return response.redirect().back()
    }

    const completion = await TutorialCompletion.query()
      .where('user_id', user.id)
      .where('tutorial_id', tutorialId)
      .first()

    if (!completion) {
      // Create completion with feedback
      await TutorialCompletion.create({
        userId: user.id,
        tutorialId,
        completedAt: DateTime.utc(),
        feedback,
      })
    } else {
      completion.feedback = feedback
      await completion.save()
    }

    session.flash('success', 'Merci pour votre retour !')
    return response.redirect().toRoute('tutorials.index')
  }
}
