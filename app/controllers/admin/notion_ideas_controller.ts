import type { HttpContext } from '@adonisjs/core/http'
import NotionIdea from '#models/notion_idea'
import NotionService from '#services/notion_service'
import { DateTime } from 'luxon'

export default class NotionIdeasController {
  /**
   * Display the Notion ideas management page
   */
  async index({ inertia }: HttpContext) {
    const ideas = await NotionIdea.query()
      .orderBy('created_at', 'desc')
      .limit(100)

    // Get stats
    const stats = {
      total: await NotionIdea.query().count('* as count').first(),
      pending: await NotionIdea.query().where('status', 'pending').count('* as count').first(),
      approved: await NotionIdea.query().where('status', 'approved').count('* as count').first(),
      byType: {
        post: await NotionIdea.query().where('content_type', 'post').count('* as count').first(),
        carousel: await NotionIdea.query().where('content_type', 'carousel').count('* as count').first(),
        reel: await NotionIdea.query().where('content_type', 'reel').count('* as count').first(),
        story: await NotionIdea.query().where('content_type', 'story').count('* as count').first(),
      },
    }

    const notionService = new NotionService()

    return inertia.render('admin/notion/index', {
      ideas: ideas.map((idea) => ({
        id: idea.id,
        notionPageId: idea.notionPageId,
        originalTitle: idea.originalTitle,
        aiGeneratedTitle: idea.aiGeneratedTitle,
        displayTitle: idea.displayTitle,
        contentType: idea.contentType,
        mediaPaths: idea.mediaPaths,
        mediaTypes: idea.mediaTypes,
        thumbnailPath: idea.thumbnailPath,
        isCarousel: idea.isCarousel,
        primaryMediaType: idea.primaryMediaType,
        clientName: idea.clientName,
        status: idea.status,
        tags: idea.tags,
        createdAt: idea.createdAt?.toISO(),
      })),
      stats: {
        total: Number(stats.total?.$extras?.count || 0),
        pending: Number(stats.pending?.$extras?.count || 0),
        approved: Number(stats.approved?.$extras?.count || 0),
        byType: {
          post: Number(stats.byType.post?.$extras?.count || 0),
          carousel: Number(stats.byType.carousel?.$extras?.count || 0),
          reel: Number(stats.byType.reel?.$extras?.count || 0),
          story: Number(stats.byType.story?.$extras?.count || 0),
        },
      },
      isNotionConfigured: notionService.isConfigured(),
    })
  }

  /**
   * Start a Notion import
   */
  async import({ request, response }: HttpContext) {
    const notionService = new NotionService()

    if (!notionService.isConfigured()) {
      return response.badRequest({ error: 'Notion API key not configured' })
    }

    const generateAiTitles = request.input('generateAiTitles', false)
    const limit = request.input('limit') ? Number(request.input('limit')) : undefined

    try {
      const importedIdeas = await notionService.importIdeas({
        generateAiTitles,
        limit,
        downloadMedia: true,
      })

      // Save to database, skip duplicates
      let created = 0
      let skipped = 0

      for (const idea of importedIdeas) {
        // Check if already exists
        const existing = await NotionIdea.findBy('notion_page_id', idea.notionPageId)
        if (existing) {
          skipped++
          continue
        }

        await NotionIdea.create({
          notionPageId: idea.notionPageId,
          originalTitle: idea.title,
          aiGeneratedTitle: idea.aiGeneratedTitle || null,
          contentType: idea.type,
          mediaPaths: idea.mediaPaths,
          mediaTypes: idea.mediaTypes,
          clientNotionId: idea.clientNotionId || null,
          clientName: idea.clientName || null,
          notionPublicationDate: idea.publicationDate
            ? DateTime.fromISO(idea.publicationDate)
            : null,
          status: 'pending',
        })
        created++
      }

      return response.json({
        success: true,
        message: `Import terminé: ${created} idées créées, ${skipped} doublons ignorés`,
        created,
        skipped,
        total: importedIdeas.length,
      })
    } catch (error) {
      console.error('NotionIdeasController: Import failed', error)
      return response.internalServerError({
        error: 'Erreur lors de l\'import',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Update idea status
   */
  async updateStatus({ params, request, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await NotionIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idée non trouvée' })
    }

    const status = request.input('status')
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'converted']
    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Statut invalide' })
    }

    idea.status = status
    await idea.save()

    return response.json({ success: true, status: idea.status })
  }

  /**
   * Update idea details (title, tags, notes)
   */
  async update({ params, request, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await NotionIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idée non trouvée' })
    }

    const aiGeneratedTitle = request.input('aiGeneratedTitle')
    const tags = request.input('tags')
    const adminNotes = request.input('adminNotes')
    const contentType = request.input('contentType')

    if (aiGeneratedTitle !== undefined) {
      idea.aiGeneratedTitle = aiGeneratedTitle || null
    }

    if (tags !== undefined) {
      idea.tags = Array.isArray(tags) ? tags : null
    }

    if (adminNotes !== undefined) {
      idea.adminNotes = adminNotes || null
    }

    if (contentType !== undefined) {
      const validTypes = ['post', 'story', 'reel', 'carousel']
      if (validTypes.includes(contentType)) {
        idea.contentType = contentType
      }
    }

    await idea.save()

    return response.json({
      success: true,
      idea: {
        id: idea.id,
        aiGeneratedTitle: idea.aiGeneratedTitle,
        tags: idea.tags,
        adminNotes: idea.adminNotes,
        contentType: idea.contentType,
      },
    })
  }

  /**
   * Delete an idea and its media files
   */
  async destroy({ params, response }: HttpContext) {
    const ideaId = Number(params.id)
    if (Number.isNaN(ideaId) || ideaId <= 0) {
      return response.badRequest({ error: 'ID invalide' })
    }

    const idea = await NotionIdea.find(ideaId)
    if (!idea) {
      return response.notFound({ error: 'Idée non trouvée' })
    }

    // Delete media files
    const notionService = new NotionService()
    for (const mediaPath of idea.mediaPaths) {
      await notionService.deleteLocalMedia(mediaPath)
    }

    await idea.delete()

    return response.json({ success: true })
  }

  /**
   * Bulk delete ideas
   */
  async bulkDelete({ request, response }: HttpContext) {
    const ids = request.input('ids')
    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ error: 'IDs requis' })
    }

    const notionService = new NotionService()
    let deleted = 0

    for (const id of ids) {
      const idea = await NotionIdea.find(Number(id))
      if (idea) {
        for (const mediaPath of idea.mediaPaths) {
          await notionService.deleteLocalMedia(mediaPath)
        }
        await idea.delete()
        deleted++
      }
    }

    return response.json({ success: true, deleted })
  }

  /**
   * Bulk update status
   */
  async bulkUpdateStatus({ request, response }: HttpContext) {
    const ids = request.input('ids')
    const status = request.input('status')

    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest({ error: 'IDs requis' })
    }

    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'converted']
    if (!validStatuses.includes(status)) {
      return response.badRequest({ error: 'Statut invalide' })
    }

    let updated = 0
    for (const id of ids) {
      const idea = await NotionIdea.find(Number(id))
      if (idea) {
        idea.status = status
        await idea.save()
        updated++
      }
    }

    return response.json({ success: true, updated })
  }

  /**
   * Get filtered ideas (API endpoint)
   */
  async list({ request, response }: HttpContext) {
    const page = Number(request.input('page', 1))
    const limit = Number(request.input('limit', 50))
    const status = request.input('status')
    const contentType = request.input('contentType')
    const clientName = request.input('clientName')
    const search = request.input('search')

    let query = NotionIdea.query().orderBy('created_at', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (contentType) {
      query = query.where('content_type', contentType)
    }

    if (clientName) {
      query = query.where('client_name', clientName)
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('original_title', `%${search}%`)
          .orWhereILike('ai_generated_title', `%${search}%`)
      })
    }

    const ideas = await query.paginate(page, limit)

    return response.json({
      ideas: ideas.all().map((idea) => ({
        id: idea.id,
        notionPageId: idea.notionPageId,
        originalTitle: idea.originalTitle,
        aiGeneratedTitle: idea.aiGeneratedTitle,
        displayTitle: idea.displayTitle,
        contentType: idea.contentType,
        mediaPaths: idea.mediaPaths,
        mediaTypes: idea.mediaTypes,
        thumbnailPath: idea.thumbnailPath,
        isCarousel: idea.isCarousel,
        clientName: idea.clientName,
        status: idea.status,
        tags: idea.tags,
        adminNotes: idea.adminNotes,
        createdAt: idea.createdAt?.toISO(),
      })),
      pagination: {
        total: ideas.total,
        perPage: ideas.perPage,
        currentPage: ideas.currentPage,
        lastPage: ideas.lastPage,
      },
    })
  }

  /**
   * Get unique client names for filter dropdown
   */
  async clients({ response }: HttpContext) {
    const clients = await NotionIdea.query()
      .select('client_name')
      .whereNotNull('client_name')
      .groupBy('client_name')
      .orderBy('client_name', 'asc')

    return response.json({
      clients: clients.map((c) => c.clientName).filter(Boolean),
    })
  }
}
