import type { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import LateService from '#services/late_service'
import Publication from '#models/publication'
import logger from '@adonisjs/core/services/logger'

// Instagram caption max length
const MAX_CONTENT_LENGTH = 2200

// Allowed URL schemes for media
const ALLOWED_URL_SCHEMES = ['https:']

export default class InstagramController {
  private lateService = new LateService()

  /**
   * Get safe base URL from environment (not from user input)
   */
  private getBaseUrl(): string {
    // Use APP_URL if defined (production)
    const appUrl = env.get('APP_URL')
    if (appUrl) {
      return appUrl
    }

    const host = env.get('HOST', 'localhost')
    const port = env.get('PORT', 3333)
    return `http://${host}:${port}`
  }

  /**
   * Validate URL is safe (no SSRF)
   */
  private isValidMediaUrl(urlString: string): boolean {
    try {
      const url = new URL(urlString)
      // Only allow HTTPS in production
      if (!ALLOWED_URL_SCHEMES.includes(url.protocol)) {
        return false
      }
      // Block internal/private IPs
      const hostname = url.hostname.toLowerCase()
      if (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.') ||
        hostname.endsWith('.local')
      ) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Show Instagram connection status and settings
   */
  async index({ inertia, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const isConfigured = this.lateService.isConfigured()

    // Get Instagram account for this specific user
    let instagramAccount = null
    if (isConfigured) {
      instagramAccount = await this.lateService.getInstagramAccountForUser(user.id)
    }

    return inertia.render('settings/instagram', {
      isConfigured,
      account: instagramAccount
        ? {
            username: instagramAccount.username,
            profilePictureUrl: instagramAccount.profilePictureUrl,
            status: instagramAccount.status,
          }
        : null,
    })
  }

  /**
   * Redirect to Late to connect Instagram
   * Creates a unique Late profile for each user
   */
  async connect({ response, session, auth }: HttpContext) {
    logger.info('Instagram connect called')
    const user = auth.getUserOrFail()
    logger.info({ userId: user.id, email: user.email }, 'User authenticated for Instagram connect')

    if (!this.lateService.isConfigured()) {
      logger.warn('Late API not configured')
      session.flash('error', 'Late API non configuree')
      return response.redirect('/settings/instagram')
    }
    logger.info('Late API is configured')

    // Use safe base URL from environment
    const baseUrl = this.getBaseUrl()
    const callbackUrl = `${baseUrl}/instagram/callback`

    // Get connect URL with user-specific profile
    logger.info({ userId: user.id, callbackUrl }, 'Getting connect URL from Late')
    const connectUrl = await this.lateService.getConnectUrl(user.id, user.email, callbackUrl)

    if (!connectUrl) {
      logger.error({ userId: user.id }, 'Failed to get connect URL from Late')
      session.flash('error', 'Impossible de se connecter a Late. Veuillez reessayer.')
      return response.redirect('/settings/instagram')
    }

    logger.info({ userId: user.id, connectUrl }, 'Redirecting to Late OAuth')
    return response.redirect(connectUrl)
  }

  /**
   * Callback after Late OAuth flow
   */
  async callback({ request, response, session, auth }: HttpContext) {
    const success = request.input('success')
    const error = request.input('error')

    if (error) {
      session.flash('error', `Erreur de connexion: ${error}`)
    } else if (success === 'true') {
      session.flash('success', 'Compte Instagram connecte avec succes!')
    }

    // Check if user is in onboarding process
    const user = auth.getUserOrFail()
    const restaurant = await user.related('restaurant').query().first()

    // If onboarding not completed, redirect back to onboarding instagram page
    if (restaurant && !restaurant.onboardingCompleted) {
      return response.redirect('/onboarding/instagram')
    }

    return response.redirect('/settings/instagram')
  }

  /**
   * Disconnect Instagram account
   */
  async disconnect({ response, session, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    const success = await this.lateService.disconnectInstagram(user.id)

    if (success) {
      session.flash('success', 'Compte Instagram deconnecte')
    } else {
      session.flash('error', 'Erreur lors de la deconnexion')
    }

    return response.redirect('/settings/instagram')
  }

  /**
   * Get connected accounts (API) for current user
   */
  async accounts({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()

    if (!this.lateService.isConfigured()) {
      return response.json({ accounts: [], configured: false })
    }

    const account = await this.lateService.getInstagramAccountForUser(user.id)
    return response.json({
      accounts: account ? [account] : [],
      configured: true,
    })
  }

  /**
   * Create a post on Instagram
   */
  async post({ request, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const { accountId, content, mediaUrl, scheduledFor } = request.only([
      'accountId',
      'content',
      'mediaUrl',
      'scheduledFor',
    ])

    // Validate required fields
    if (!accountId || typeof accountId !== 'string') {
      return response.badRequest({ error: 'accountId est requis et doit etre une chaine' })
    }

    if (!content || typeof content !== 'string') {
      return response.badRequest({ error: 'content est requis et doit etre une chaine' })
    }

    // Validate content length (Instagram limit)
    if (content.length > MAX_CONTENT_LENGTH) {
      return response.badRequest({
        error: `Le contenu ne doit pas depasser ${MAX_CONTENT_LENGTH} caracteres`,
      })
    }

    // Validate media URL if provided (SSRF protection)
    if (mediaUrl) {
      if (typeof mediaUrl !== 'string' || !this.isValidMediaUrl(mediaUrl)) {
        return response.badRequest({
          error: 'URL du media invalide. Seules les URLs HTTPS publiques sont autorisees.',
        })
      }
    }

    // Validate scheduled date if provided
    let scheduledDate: Date | undefined
    if (scheduledFor) {
      scheduledDate = new Date(scheduledFor)
      if (isNaN(scheduledDate.getTime())) {
        return response.badRequest({ error: 'Date de programmation invalide' })
      }
      // Must be in the future
      if (scheduledDate <= new Date()) {
        return response.badRequest({ error: 'La date de programmation doit etre dans le futur' })
      }
    }

    const result = await this.lateService.createPost(
      accountId,
      content,
      mediaUrl,
      scheduledDate
    )

    if (!result.success) {
      logger.error({ userId: user.id, error: result.error }, 'Instagram post failed')
      return response.internalServerError({ error: 'Echec de la publication' })
    }

    logger.info({ userId: user.id, postId: result.postId }, 'Instagram post created')
    return response.json({
      success: true,
      postId: result.postId,
    })
  }

  /**
   * Get post status
   * Verifies user owns the publication before accessing Late API
   */
  async postStatus({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const postId = params.id

    // Verify user owns a publication with this Late post ID
    const publication = await Publication.query()
      .where('later_media_id', postId)
      .where('user_id', user.id)
      .first()

    if (!publication) {
      return response.notFound({ error: 'Post non trouve' })
    }

    const post = await this.lateService.getPostStatus(postId)

    if (!post) {
      return response.notFound({ error: 'Post non trouve sur Late API' })
    }

    return response.json(post)
  }

  /**
   * Delete a scheduled post
   * Verifies user owns the publication before deleting via Late API
   */
  async deletePost({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const postId = params.id

    // Verify user owns a publication with this Late post ID
    const publication = await Publication.query()
      .where('later_media_id', postId)
      .where('user_id', user.id)
      .first()

    if (!publication) {
      return response.notFound({ error: 'Post non trouve' })
    }

    const success = await this.lateService.deletePost(postId)

    if (!success) {
      return response.internalServerError({ error: 'Echec de la suppression' })
    }

    // Update local publication status
    publication.status = 'deleted'
    await publication.save()

    return response.json({ success: true })
  }

  /**
   * Check if Late is configured (API)
   */
  async status({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const isConfigured = this.lateService.isConfigured()
    let account = null

    if (isConfigured) {
      account = await this.lateService.getInstagramAccountForUser(user.id)
    }

    return response.json({
      configured: isConfigured,
      connected: !!account,
      account: account
        ? {
            username: account.username,
            status: account.status,
          }
        : null,
    })
  }
}
