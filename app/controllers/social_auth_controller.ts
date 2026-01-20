import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import jwt from 'jsonwebtoken'
import env from '#start/env'
import crypto from 'node:crypto'

export default class SocialAuthController {
  /**
   * Redirect to Google OAuth (manual implementation to avoid scope duplication issue)
   */
  async googleRedirect({ response, session }: HttpContext) {
    const clientId = env.get('GOOGLE_CLIENT_ID')
    const callbackUrl = env.get('GOOGLE_CALLBACK_URL', 'http://localhost:3333/auth/google/callback')

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex')
    session.put('google_oauth_state', state)

    // Build URL manually to ensure proper encoding
    const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'
    const queryParams = [
      `client_id=${encodeURIComponent(clientId!)}`,
      `redirect_uri=${encodeURIComponent(callbackUrl)}`,
      `response_type=code`,
      `scope=${encodeURIComponent('openid email profile')}`,
      `state=${state}`,
      `access_type=offline`,
      `prompt=select_account`,
    ].join('&')

    return response.redirect(`${baseUrl}?${queryParams}`)
  }

  /**
   * Handle Google OAuth callback (manual implementation)
   */
  async googleCallback({ request, auth, response, session }: HttpContext) {
    const { code, state, error } = request.qs()

    if (error) {
      session.flash('error', 'Accès refusé. Veuillez réessayer.')
      return response.redirect('/login')
    }

    // Verify state for CSRF protection
    const savedState = session.get('google_oauth_state')
    if (!savedState || savedState !== state) {
      session.flash('error', 'Erreur de validation. Veuillez réessayer.')
      return response.redirect('/login')
    }
    session.forget('google_oauth_state')

    if (!code) {
      session.flash('error', 'Code d\'autorisation manquant.')
      return response.redirect('/login')
    }

    try {
      // Exchange code for tokens
      const clientId = env.get('GOOGLE_CLIENT_ID')
      const clientSecret = env.get('GOOGLE_CLIENT_SECRET')
      const callbackUrl = env.get('GOOGLE_CALLBACK_URL', 'http://localhost:3333/auth/google/callback')

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      })

      const tokens = (await tokenResponse.json()) as { access_token?: string }

      if (!tokens.access_token) {
        session.flash('error', 'Erreur lors de l\'échange du token.')
        return response.redirect('/login')
      }

      // Get user info
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })

      const googleUser = (await userInfoResponse.json()) as {
        id: string
        email: string
        name: string
        picture?: string
      }

      if (!googleUser.email) {
        session.flash('error', 'Email non disponible depuis Google.')
        return response.redirect('/login')
      }

      // Find or create user
      let user = await User.query()
        .where('google_id', googleUser.id)
        .orWhere('email', googleUser.email)
        .first()

      if (user) {
        // Update Google ID if not set (user registered with email first)
        if (!user.googleId) {
          user.googleId = googleUser.id
          user.avatarUrl = googleUser.picture || user.avatarUrl
          await user.save()
        }
      } else {
        // Create new user
        user = await User.create({
          email: googleUser.email,
          fullName: googleUser.name,
          googleId: googleUser.id,
          avatarUrl: googleUser.picture,
          role: 'user',
          password: null, // No password for social auth users
        })
      }

      // Log the user in
      await auth.use('web').login(user)

      // Check if user needs onboarding
      const restaurant = await user.related('restaurant').query().first()
      if (!restaurant) {
        return response.redirect('/restaurant/type')
      }

      return response.redirect('/dashboard')
    } catch (err) {
      console.error('Google auth error:', err)
      session.flash('error', 'Erreur lors de la connexion Google.')
      return response.redirect('/login')
    }
  }

  /**
   * Redirect to Apple Sign In
   * Note: Apple Sign In requires special setup - using custom implementation
   */
  async appleRedirect({ response }: HttpContext) {
    const clientId = env.get('APPLE_CLIENT_ID')
    const redirectUri = env.get('APPLE_CALLBACK_URL', 'http://localhost:3333/auth/apple/callback')
    const state = Math.random().toString(36).substring(7)

    const params = new URLSearchParams({
      response_type: 'code id_token',
      response_mode: 'form_post',
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: 'name email',
    })

    return response.redirect(`https://appleid.apple.com/auth/authorize?${params.toString()}`)
  }

  /**
   * Handle Apple Sign In callback
   * Apple sends POST request with form data
   */
  async appleCallback({ request, auth, response, session }: HttpContext) {
    const { id_token, user: appleUserData, error } = request.all()

    if (error) {
      session.flash('error', 'Connexion Apple refusée.')
      return response.redirect('/login')
    }

    if (!id_token) {
      session.flash('error', 'Token Apple manquant.')
      return response.redirect('/login')
    }

    try {
      // Decode Apple ID token (JWT)
      const decoded = jwt.decode(id_token) as {
        sub: string
        email?: string
        email_verified?: string
      }

      if (!decoded || !decoded.sub) {
        session.flash('error', 'Token Apple invalide.')
        return response.redirect('/login')
      }

      const appleId = decoded.sub
      const email = decoded.email

      // Apple only sends user info on first authorization
      let fullName: string | null = null
      if (appleUserData) {
        try {
          const userData = typeof appleUserData === 'string' ? JSON.parse(appleUserData) : appleUserData
          if (userData.name) {
            fullName = [userData.name.firstName, userData.name.lastName].filter(Boolean).join(' ')
          }
        } catch {
          // User data parsing failed, continue without name
        }
      }

      // Find or create user
      let user = await User.query()
        .where('apple_id', appleId)
        .orWhere((query) => {
          if (email) {
            query.where('email', email)
          }
        })
        .first()

      if (user) {
        // Update Apple ID if not set
        if (!user.appleId) {
          user.appleId = appleId
          await user.save()
        }
        // Update name if we have it and user doesn't
        if (fullName && !user.fullName) {
          user.fullName = fullName
          await user.save()
        }
      } else {
        if (!email) {
          session.flash('error', 'Email requis pour créer un compte.')
          return response.redirect('/login')
        }

        user = await User.create({
          email,
          fullName,
          appleId,
          role: 'user',
          password: null,
        })
      }

      // Log the user in
      await auth.use('web').login(user)

      // Check if user needs onboarding
      const restaurant = await user.related('restaurant').query().first()
      if (!restaurant) {
        return response.redirect('/restaurant/type')
      }

      return response.redirect('/dashboard')
    } catch (err) {
      console.error('Apple auth error:', err)
      session.flash('error', 'Erreur lors de la connexion Apple.')
      return response.redirect('/login')
    }
  }
}
