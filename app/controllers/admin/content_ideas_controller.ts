import type { HttpContext } from '@adonisjs/core/http'
import ContentIdea from '#models/content_idea'
import MissionTemplate from '#models/mission_template'
import { createContentIdeaValidator, updateContentIdeaValidator } from '#validators/admin'

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
      })),
    })
  }

  /**
   * Create a new content idea for a template
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createContentIdeaValidator)

    // Verify template exists
    const template = await MissionTemplate.find(data.missionTemplateId)
    if (!template) {
      return response.notFound({ error: 'Template non trouve' })
    }

    const idea = await ContentIdea.create({
      missionTemplateId: data.missionTemplateId,
      suggestionText: data.suggestionText,
      photoTips: data.photoTips || null,
      isActive: data.isActive ?? true,
    })

    return response.json({
      success: true,
      idea: {
        id: idea.id,
        missionTemplateId: idea.missionTemplateId,
        suggestionText: idea.suggestionText,
        photoTips: idea.photoTips,
        isActive: idea.isActive,
      },
    })
  }

  /**
   * Update a content idea
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

    const data = await request.validateUsing(updateContentIdeaValidator)

    idea.merge({
      suggestionText: data.suggestionText,
      photoTips: data.photoTips ?? null,
      isActive: data.isActive ?? idea.isActive,
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

    await idea.delete()

    return response.json({ success: true })
  }
}
