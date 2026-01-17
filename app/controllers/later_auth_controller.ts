import type { HttpContext } from '@adonisjs/core/http'
import LaterService from '#services/later_service'
import string from '@adonisjs/core/helpers/string'

export default class LaterAuthController {
  /**
   * Redirect to Later OAuth authorization
   */
  async redirect({ response, auth, session }: HttpContext) {
    const user = auth.user!
    const laterService = new LaterService()

    if (!laterService.isConfigured()) {
      session.flash('error', 'La connexion Instagram n\'est pas encore disponible.')
      return response.redirect().back()
    }

    // Generate cryptographically secure state token
    const state = string.random(32)
    session.put('later_oauth_state', state)
    session.put('later_oauth_user_id', user.id)

    const authUrl = laterService.getAuthorizationUrl(state)
    return response.redirect(authUrl)
  }

  /**
   * Handle Later OAuth callback
   */
  async callback({ request, response, session }: HttpContext) {
    const laterService = new LaterService()

    const code = request.input('code')
    const state = request.input('state')
    const error = request.input('error')

    // Check for OAuth error
    if (error) {
      session.flash('error', 'La connexion Instagram a été annulée.')
      return response.redirect().toRoute('onboarding.instagram')
    }

    // Validate state to prevent CSRF
    const savedState = session.get('later_oauth_state')
    const savedUserId = session.get('later_oauth_user_id')

    if (!state || state !== savedState || !savedUserId) {
      session.flash('error', 'Session expirée. Veuillez réessayer.')
      return response.redirect().toRoute('onboarding.instagram')
    }

    // Clear OAuth session data
    session.forget('later_oauth_state')
    session.forget('later_oauth_user_id')

    if (!code) {
      session.flash('error', 'Code d\'autorisation manquant.')
      return response.redirect().toRoute('onboarding.instagram')
    }

    // Exchange code for tokens
    const tokens = await laterService.exchangeCodeForTokens(code)
    if (!tokens) {
      session.flash('error', 'Échec de la connexion Instagram. Veuillez réessayer.')
      return response.redirect().toRoute('onboarding.instagram')
    }

    // Get Instagram username
    const username = await laterService.getInstagramUsername(tokens.access_token)
    if (!username) {
      session.flash('error', 'Impossible de récupérer votre compte Instagram.')
      return response.redirect().toRoute('onboarding.instagram')
    }

    // Store connection
    await laterService.storeConnection(savedUserId, tokens, username)

    session.flash('success', `Compte Instagram @${username} connecté !`)
    return response.redirect().toRoute('onboarding.instagram')
  }
}
