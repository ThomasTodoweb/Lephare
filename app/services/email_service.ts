import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import EmailSettings from '#models/email_settings'
import EmailLog, { type EmailType, type EmailStatus } from '#models/email_log'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'
import { DateTime } from 'luxon'

interface EmailOptions {
  to: string
  toName?: string
  subject: string
  html: string
  text?: string
  emailType: EmailType
  userId?: number
}

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
  errorCode?: string
  response?: Record<string, unknown>
}

export default class EmailService {
  private settings: EmailSettings | null = null

  /**
   * Get email settings (cached)
   */
  private async getSettings(): Promise<EmailSettings> {
    if (!this.settings) {
      this.settings = await EmailSettings.getSettings()
    }
    return this.settings
  }

  /**
   * Clear cached settings (call after admin updates)
   */
  clearCache() {
    this.settings = null
  }

  /**
   * Check if email service is configured
   */
  async isConfigured(): Promise<boolean> {
    const settings = await this.getSettings()
    if (!settings.emailsEnabled) return false

    if (settings.provider === 'resend') {
      return !!settings.resendApiKey
    }

    return !!(settings.smtpHost && settings.smtpUser)
  }

  /**
   * Create an email log entry
   */
  private async createLog(
    options: EmailOptions,
    provider: string,
    status: EmailStatus = 'pending'
  ): Promise<EmailLog> {
    return EmailLog.create({
      toEmail: options.to,
      toName: options.toName || null,
      subject: options.subject,
      emailType: options.emailType,
      provider,
      status,
      userId: options.userId || null,
    })
  }

  /**
   * Update log with result
   */
  private async updateLog(
    log: EmailLog,
    result: SendResult
  ): Promise<void> {
    log.status = result.success ? 'sent' : 'failed'
    log.sentAt = result.success ? DateTime.now() : null
    log.providerMessageId = result.messageId || null
    log.errorMessage = result.error || null
    log.errorCode = result.errorCode || null
    log.providerResponse = result.response || null
    await log.save()
  }

  /**
   * Send an email using configured provider
   */
  async send(options: EmailOptions): Promise<boolean> {
    const settings = await this.getSettings()

    if (!settings.emailsEnabled) {
      logger.info('Emails are disabled, skipping send')
      return false
    }

    // Create log entry
    const log = await this.createLog(options, settings.provider)

    try {
      let result: SendResult

      if (settings.provider === 'resend') {
        result = await this.sendWithResend(options, settings)
      } else {
        result = await this.sendWithSMTP(options, settings)
      }

      // Update log with result
      await this.updateLog(log, result)

      return result.success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorCode = (error as { code?: string })?.code || 'UNKNOWN'

      logger.error({ error, to: options.to }, 'Failed to send email')

      // Update log with error
      await this.updateLog(log, {
        success: false,
        error: errorMessage,
        errorCode,
        response: { raw: String(error) },
      })

      return false
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendWithResend(options: EmailOptions, settings: EmailSettings): Promise<SendResult> {
    if (!settings.resendApiKey) {
      logger.error('Resend API key not configured')
      return { success: false, error: 'API key not configured', errorCode: 'NO_API_KEY' }
    }

    const resend = new Resend(settings.resendApiKey)

    const { data, error } = await resend.emails.send({
      from: `${settings.fromName} <${settings.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    if (error) {
      logger.error({ error }, 'Resend API error')
      return {
        success: false,
        error: error.message,
        errorCode: error.name,
        response: error as unknown as Record<string, unknown>,
      }
    }

    logger.info({ to: options.to, subject: options.subject }, 'Email sent via Resend')
    return {
      success: true,
      messageId: data?.id,
      response: data as unknown as Record<string, unknown>,
    }
  }

  /**
   * Send email using SMTP
   */
  private async sendWithSMTP(options: EmailOptions, settings: EmailSettings): Promise<SendResult> {
    if (!settings.smtpHost) {
      logger.error('SMTP not configured')
      return { success: false, error: 'SMTP not configured', errorCode: 'NO_SMTP' }
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort,
      secure: settings.smtpSecure,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPassword,
      },
    })

    const info = await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })

    logger.info({ to: options.to, subject: options.subject, messageId: info.messageId }, 'Email sent via SMTP')
    return {
      success: true,
      messageId: info.messageId,
      response: {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      },
    }
  }

  // ============================================
  // Email Templates
  // ============================================

  /**
   * Generate base email template with DA colors
   */
  private baseTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Le Phare</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Montserrat', 'Poppins', Arial, sans-serif;
      background-color: #feefe1;
      color: #21201c;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .logo {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-text {
      font-size: 28px;
      font-weight: 800;
      color: #dd2c0c;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #21201c;
      text-transform: uppercase;
      margin: 0 0 20px 0;
      text-align: center;
    }
    p {
      font-size: 16px;
      line-height: 1.6;
      color: #4a4a4a;
      margin: 0 0 16px 0;
    }
    .code-box {
      background-color: #feefe1;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #dd2c0c;
      font-family: monospace;
    }
    .button {
      display: inline-block;
      background-color: #dd2c0c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 50px;
      font-weight: 700;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0;
    }
    .button:hover {
      background-color: #b82409;
    }
    .button-container {
      text-align: center;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
    }
    .footer p {
      font-size: 12px;
      color: #999;
    }
    .highlight {
      color: #dd2c0c;
      font-weight: 700;
    }
    .mission-card {
      background: linear-gradient(135deg, #dd2c0c 0%, #b82409 100%);
      border-radius: 12px;
      padding: 24px;
      color: white;
      margin: 24px 0;
    }
    .mission-card h2 {
      color: white;
      margin: 0 0 12px 0;
      font-size: 18px;
    }
    .mission-card p {
      color: rgba(255,255,255,0.9);
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <span class="logo-text">Le Phare</span>
      </div>
      ${content}
      <div class="footer">
        <p>Cet email a ete envoye par Le Phare.<br>Si vous n'avez pas demande cet email, vous pouvez l'ignorer.</p>
        <p>&copy; ${new Date().getFullYear()} Le Phare. Tous droits reserves.</p>
      </div>
    </div>
  </div>
</body>
</html>`
  }

  /**
   * Replace template variables with actual values
   */
  private replaceTemplateVariables(
    template: string,
    variables: {
      prenom?: string
      code?: string
      lien?: string
      restaurant?: string
      titre?: string
      description?: string
      categorie?: string
    }
  ): string {
    let content = template
    content = content.replace(/{prenom}/g, variables.prenom || 'utilisateur')
    content = content.replace(/{code}/g, variables.code || '')
    content = content.replace(/{lien}/g, variables.lien || '')
    content = content.replace(/{restaurant}/g, variables.restaurant || '')
    content = content.replace(/{titre}/g, variables.titre || '')
    content = content.replace(/{description}/g, variables.description || '')
    content = content.replace(/{categorie}/g, variables.categorie || '')
    return content
  }

  /**
   * Convert plain text with line breaks to HTML paragraphs
   */
  private textToHtml(text: string): string {
    return text
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => `<p>${line}</p>`)
      .join('\n')
  }

  /**
   * Email verification code template (uses DB content)
   */
  async verificationEmailTemplateFromDb(code: string, userName?: string): Promise<string> {
    const settings = await this.getSettings()
    const content = this.replaceTemplateVariables(settings.verificationEmailContent || '', {
      prenom: userName,
      code,
    })
    return this.baseTemplate(`
      <h1>Confirmez votre email</h1>
      ${this.textToHtml(content)}
      <div class="code-box">
        <span class="code">${code}</span>
      </div>
      <p>Ce code expire dans <span class="highlight">15 minutes</span>.</p>
    `)
  }

  /**
   * Welcome email template (uses DB content)
   */
  async welcomeEmailTemplateFromDb(userName?: string): Promise<string> {
    const settings = await this.getSettings()
    const appUrl = env.get('APP_URL', 'https://lephare.todoweb.fr')
    const content = this.replaceTemplateVariables(settings.welcomeEmailContent || '', {
      prenom: userName,
    })
    return this.baseTemplate(`
      <h1>Bienvenue sur Le Phare !</h1>
      ${this.textToHtml(content)}
      <div class="button-container">
        <a href="${appUrl}/dashboard" class="button">Acceder a mon espace</a>
      </div>
    `)
  }

  /**
   * Password reset email template (uses DB content)
   */
  async passwordResetEmailTemplateFromDb(resetLink: string, userName?: string): Promise<string> {
    const settings = await this.getSettings()
    const content = this.replaceTemplateVariables(settings.passwordResetEmailContent || '', {
      prenom: userName,
      lien: resetLink,
    })
    return this.baseTemplate(`
      <h1>Reinitialiser votre mot de passe</h1>
      ${this.textToHtml(content)}
      <div class="button-container">
        <a href="${resetLink}" class="button">Reinitialiser mon mot de passe</a>
      </div>
      <p>Ce lien expire dans <span class="highlight">1 heure</span>.</p>
      <p style="font-size: 12px; color: #999; margin-top: 24px;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>${resetLink}</p>
    `)
  }

  /**
   * Daily mission email template (uses DB content)
   */
  async dailyMissionEmailTemplateFromDb(
    mission: { title: string; description: string; category: string },
    userName?: string,
    restaurantName?: string
  ): Promise<string> {
    const settings = await this.getSettings()
    const appUrl = env.get('APP_URL', 'https://lephare.todoweb.fr')
    const content = this.replaceTemplateVariables(settings.dailyMissionEmailContent || '', {
      prenom: userName,
      restaurant: restaurantName,
      titre: mission.title,
      description: mission.description,
      categorie: mission.category,
    })
    return this.baseTemplate(`
      <h1>Votre mission du jour</h1>
      ${this.textToHtml(content)}
      <div class="mission-card">
        <h2>${mission.title}</h2>
        <p>${mission.description}</p>
      </div>
      <p>Categorie : <span class="highlight">${mission.category}</span></p>
      <div class="button-container">
        <a href="${appUrl}/missions" class="button">Voir ma mission</a>
      </div>
    `)
  }

  // ============================================
  // Send specific emails
  // ============================================

  /**
   * Send verification code email
   */
  async sendVerificationEmail(to: string, code: string, userName?: string, userId?: number): Promise<boolean> {
    const settings = await this.getSettings()
    if (!settings.verificationEmailEnabled) return false

    return this.send({
      to,
      toName: userName,
      subject: settings.verificationEmailSubject,
      html: await this.verificationEmailTemplateFromDb(code, userName),
      text: `Votre code de verification Le Phare est : ${code}. Ce code expire dans 15 minutes.`,
      emailType: 'verification',
      userId,
    })
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, userName?: string, userId?: number): Promise<boolean> {
    const settings = await this.getSettings()

    return this.send({
      to,
      toName: userName,
      subject: settings.welcomeEmailSubject,
      html: await this.welcomeEmailTemplateFromDb(userName),
      text: `Bienvenue sur Le Phare ! Votre compte est maintenant actif.`,
      emailType: 'welcome',
      userId,
    })
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(to: string, resetLink: string, userName?: string, userId?: number): Promise<boolean> {
    const settings = await this.getSettings()

    return this.send({
      to,
      toName: userName,
      subject: settings.passwordResetEmailSubject,
      html: await this.passwordResetEmailTemplateFromDb(resetLink, userName),
      text: `Cliquez sur ce lien pour reinitialiser votre mot de passe : ${resetLink}. Ce lien expire dans 1 heure.`,
      emailType: 'password_reset',
      userId,
    })
  }

  /**
   * Send daily mission email
   */
  async sendDailyMissionEmail(
    to: string,
    mission: { title: string; description: string; category: string },
    userName?: string,
    restaurantName?: string,
    userId?: number
  ): Promise<boolean> {
    const settings = await this.getSettings()
    if (!settings.dailyMissionEmailEnabled) return false

    return this.send({
      to,
      toName: userName,
      subject: settings.dailyMissionEmailSubject,
      html: await this.dailyMissionEmailTemplateFromDb(mission, userName, restaurantName),
      text: `Votre mission du jour : ${mission.title}. ${mission.description}`,
      emailType: 'daily_mission',
      userId,
    })
  }

  /**
   * Send test email (for admin testing)
   */
  async sendTestEmail(to: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Test email - Le Phare',
      html: this.baseTemplate(`
        <h1>Email de test</h1>
        <p>Si vous recevez cet email, la configuration email fonctionne correctement !</p>
        <p>Date d'envoi : <span class="highlight">${new Date().toLocaleString('fr-FR')}</span></p>
      `),
      text: 'Email de test Le Phare - Configuration OK',
      emailType: 'test',
    })
  }
}
