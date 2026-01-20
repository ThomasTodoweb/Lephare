import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { registerValidator, loginValidator } from '#validators/auth'
import StripeService from '#services/stripe_service'
import EmailService from '#services/email_service'
import { DateTime } from 'luxon'
import crypto from 'node:crypto'
import env from '#start/env'

export default class AuthController {
  private stripeService = new StripeService()
  private emailService = new EmailService()

  /**
   * Generate a 6-digit verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Generate a secure password reset token
   */
  private generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex')
  }

  async showRegister({ inertia }: HttpContext) {
    return inertia.render('auth/register')
  }

  async register({ request, response, session }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    // Check if email service is configured
    const emailConfigured = await this.emailService.isConfigured()

    // Generate verification code
    const verificationCode = this.generateVerificationCode()
    const codeExpiresAt = DateTime.now().plus({ minutes: 15 })

    const user = await User.create({
      email: data.email,
      password: data.password,
      role: 'user',
      emailVerified: !emailConfigured, // Auto-verify if email not configured
      emailVerificationCode: emailConfigured ? verificationCode : null,
      emailVerificationCodeExpiresAt: emailConfigured ? codeExpiresAt : null,
      emailNotificationsEnabled: true,
      emailNotificationTime: '10:00',
    })

    // Create 7-day free trial subscription
    await this.stripeService.createTrialSubscription(user.id, 7)

    if (emailConfigured) {
      // Send verification email
      await this.emailService.sendVerificationEmail(user.email, verificationCode, user.fullName || undefined)

      // Store user id in session for verification page
      session.put('pending_verification_user_id', user.id)

      return response.redirect('/verify-email')
    } else {
      // Email not configured, log user in directly
      // We don't import auth here to avoid type issues, so we redirect to login
      session.flash('success', 'Compte cree avec succes ! Connectez-vous pour continuer.')
      return response.redirect('/login')
    }
  }

  /**
   * Show email verification page
   */
  async showVerifyEmail({ inertia, session, response }: HttpContext) {
    const userId = session.get('pending_verification_user_id')

    if (!userId) {
      return response.redirect('/login')
    }

    const user = await User.find(userId)
    if (!user || user.emailVerified) {
      session.forget('pending_verification_user_id')
      return response.redirect('/login')
    }

    return inertia.render('auth/verify-email', {
      email: user.email,
    })
  }

  /**
   * Verify email with code
   */
  async verifyEmail({ request, response, session, auth }: HttpContext) {
    const userId = session.get('pending_verification_user_id')
    const { code } = request.only(['code'])

    if (!userId) {
      session.flash('error', 'Session expiree. Veuillez vous reconnecter.')
      return response.redirect('/login')
    }

    const user = await User.find(userId)
    if (!user) {
      session.flash('error', 'Utilisateur non trouve.')
      return response.redirect('/login')
    }

    // Check if already verified
    if (user.emailVerified) {
      session.forget('pending_verification_user_id')
      await auth.use('web').login(user)
      return response.redirect('/restaurant/type')
    }

    // Verify code using constant-time comparison to prevent timing attacks
    const storedCode = user.emailVerificationCode || ''
    const providedCode = String(code || '')
    const isCodeValid =
      storedCode.length === providedCode.length &&
      crypto.timingSafeEqual(Buffer.from(storedCode), Buffer.from(providedCode))

    if (!isCodeValid) {
      session.flash('error', 'Code incorrect. Veuillez reessayer.')
      return response.redirect('/verify-email')
    }

    // Check expiration
    if (user.emailVerificationCodeExpiresAt && user.emailVerificationCodeExpiresAt < DateTime.now()) {
      session.flash('error', 'Code expire. Demandez un nouveau code.')
      return response.redirect('/verify-email')
    }

    // Mark as verified
    user.emailVerified = true
    user.emailVerificationCode = null
    user.emailVerificationCodeExpiresAt = null
    await user.save()

    session.forget('pending_verification_user_id')

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.fullName || undefined)

    // Log user in
    await auth.use('web').login(user)

    session.flash('success', 'Email verifie avec succes ! Bienvenue sur Le Phare.')
    return response.redirect('/restaurant/type')
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode({ response, session }: HttpContext) {
    const userId = session.get('pending_verification_user_id')

    if (!userId) {
      return response.redirect('/login')
    }

    const user = await User.find(userId)
    if (!user || user.emailVerified) {
      session.forget('pending_verification_user_id')
      return response.redirect('/login')
    }

    // Generate new code
    const verificationCode = this.generateVerificationCode()
    user.emailVerificationCode = verificationCode
    user.emailVerificationCodeExpiresAt = DateTime.now().plus({ minutes: 15 })
    await user.save()

    // Send new email
    await this.emailService.sendVerificationEmail(user.email, verificationCode, user.fullName || undefined)

    session.flash('success', 'Un nouveau code a ete envoye a votre adresse email.')
    return response.redirect('/verify-email')
  }

  async showLogin({ inertia }: HttpContext) {
    return inertia.render('auth/login')
  }

  async login({ request, response, auth, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    try {
      const user = await User.verifyCredentials(email, password)

      // Check if email is verified (skip for social auth users)
      if (!user.emailVerified && !user.googleId && !user.appleId) {
        // Generate new verification code
        const verificationCode = this.generateVerificationCode()
        user.emailVerificationCode = verificationCode
        user.emailVerificationCodeExpiresAt = DateTime.now().plus({ minutes: 15 })
        await user.save()

        // Send verification email
        await this.emailService.sendVerificationEmail(user.email, verificationCode, user.fullName || undefined)

        session.put('pending_verification_user_id', user.id)
        session.flash('error', 'Veuillez verifier votre email avant de vous connecter.')
        return response.redirect('/verify-email')
      }

      await auth.use('web').login(user)

      const restaurant = await user.related('restaurant').query().first()
      if (!restaurant) {
        return response.redirect().toRoute('restaurant.type')
      }

      return response.redirect().toRoute('dashboard')
    } catch {
      session.flash('errors', { email: 'Email ou mot de passe incorrect' })
      return response.redirect().back()
    }
  }

  /**
   * Show forgot password page
   */
  async showForgotPassword({ inertia }: HttpContext) {
    return inertia.render('auth/forgot-password')
  }

  /**
   * Send password reset email
   */
  async forgotPassword({ request, response, session }: HttpContext) {
    const { email } = request.only(['email'])

    const user = await User.findBy('email', email)

    // Always show success message to prevent email enumeration
    session.flash('success', 'Si cette adresse existe, vous recevrez un email de reinitialisation.')

    if (user && user.password) {
      // Only allow password reset for users with passwords (not social auth only)
      const resetToken = this.generateResetToken()
      user.passwordResetToken = resetToken
      user.passwordResetTokenExpiresAt = DateTime.now().plus({ hours: 1 })
      await user.save()

      const appUrl = env.get('APP_URL', 'https://lephare.todoweb.fr')
      const resetLink = `${appUrl}/reset-password?token=${resetToken}`
      await this.emailService.sendPasswordResetEmail(user.email, resetLink, user.fullName || undefined)
    }

    return response.redirect('/forgot-password')
  }

  /**
   * Show reset password page
   */
  async showResetPassword({ request, inertia, response, session }: HttpContext) {
    const token = request.input('token')

    if (!token) {
      session.flash('error', 'Lien de reinitialisation invalide.')
      return response.redirect('/forgot-password')
    }

    const user = await User.findBy('password_reset_token', token)

    if (!user) {
      session.flash('error', 'Lien de reinitialisation invalide ou expire.')
      return response.redirect('/forgot-password')
    }

    if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < DateTime.now()) {
      session.flash('error', 'Ce lien a expire. Demandez un nouveau lien.')
      return response.redirect('/forgot-password')
    }

    return inertia.render('auth/reset-password', { token })
  }

  /**
   * Reset password
   */
  async resetPassword({ request, response, session }: HttpContext) {
    const { token, password } = request.only(['token', 'password'])

    if (!token || !password) {
      session.flash('error', 'Donnees manquantes.')
      return response.redirect('/forgot-password')
    }

    const user = await User.findBy('password_reset_token', token)

    if (!user) {
      session.flash('error', 'Lien de reinitialisation invalide.')
      return response.redirect('/forgot-password')
    }

    if (user.passwordResetTokenExpiresAt && user.passwordResetTokenExpiresAt < DateTime.now()) {
      session.flash('error', 'Ce lien a expire. Demandez un nouveau lien.')
      return response.redirect('/forgot-password')
    }

    // Update password (AuthFinder will hash automatically on save)
    user.password = password
    user.passwordResetToken = null
    user.passwordResetTokenExpiresAt = null
    await user.save()

    session.flash('success', 'Mot de passe mis a jour avec succes ! Vous pouvez maintenant vous connecter.')
    return response.redirect('/login')
  }

  async logout({ auth, response, session }: HttpContext) {
    await auth.use('web').logout()
    session.flash('success', 'Deconnexion reussie')
    return response.redirect().toRoute('login')
  }
}
