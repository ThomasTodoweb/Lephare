import type { HttpContext } from '@adonisjs/core/http'
import EmailSettings from '#models/email_settings'
import EmailService from '#services/email_service'

export default class EmailsController {
  private emailService = new EmailService()

  /**
   * Show email settings page
   */
  async index({ inertia }: HttpContext) {
    const settings = await EmailSettings.getSettings()

    return inertia.render('admin/emails/index', {
      settings: {
        // SMTP
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpSecure: settings.smtpSecure,
        smtpUser: settings.smtpUser,
        smtpPasswordSet: !!settings.smtpPassword,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,

        // Provider
        provider: settings.provider,
        resendApiKeySet: !!settings.resendApiKey,

        // Global settings
        emailsEnabled: settings.emailsEnabled,
        verificationEmailEnabled: settings.verificationEmailEnabled,
        dailyMissionEmailEnabled: settings.dailyMissionEmailEnabled,
        dailyMissionEmailTime: settings.dailyMissionEmailTime,

        // Subjects
        welcomeEmailSubject: settings.welcomeEmailSubject,
        verificationEmailSubject: settings.verificationEmailSubject,
        passwordResetEmailSubject: settings.passwordResetEmailSubject,
        dailyMissionEmailSubject: settings.dailyMissionEmailSubject,

        // Template contents
        verificationEmailContent: settings.verificationEmailContent,
        welcomeEmailContent: settings.welcomeEmailContent,
        passwordResetEmailContent: settings.passwordResetEmailContent,
        dailyMissionEmailContent: settings.dailyMissionEmailContent,

        // Account changes email
        accountChangesEmailEnabled: settings.accountChangesEmailEnabled,
        accountChangesEmailSubject: settings.accountChangesEmailSubject,
        accountChangesEmailContent: settings.accountChangesEmailContent,

        // Weekly summary email
        weeklySummaryEmailEnabled: settings.weeklySummaryEmailEnabled,
        weeklySummaryEmailSubject: settings.weeklySummaryEmailSubject,
        weeklySummaryEmailContent: settings.weeklySummaryEmailContent,
      },
    })
  }

  /**
   * Update email settings
   */
  async update({ request, response, session }: HttpContext) {
    const settings = await EmailSettings.getSettings()

    const data = request.only([
      'smtp_host',
      'smtp_port',
      'smtp_secure',
      'smtp_user',
      'smtp_password',
      'from_email',
      'from_name',
      'provider',
      'resend_api_key',
      'emails_enabled',
      'verification_email_enabled',
      'daily_mission_email_enabled',
      'daily_mission_email_time',
      'welcome_email_subject',
      'verification_email_subject',
      'password_reset_email_subject',
      'daily_mission_email_subject',
      'verification_email_content',
      'welcome_email_content',
      'password_reset_email_content',
      'daily_mission_email_content',
      'account_changes_email_enabled',
      'account_changes_email_subject',
      'account_changes_email_content',
      'weekly_summary_email_enabled',
      'weekly_summary_email_subject',
      'weekly_summary_email_content',
    ])

    // Update SMTP settings
    if (data.smtp_host !== undefined) settings.smtpHost = data.smtp_host
    if (data.smtp_port !== undefined) settings.smtpPort = parseInt(data.smtp_port) || 587
    if (data.smtp_secure !== undefined) settings.smtpSecure = data.smtp_secure === 'true' || data.smtp_secure === true
    if (data.smtp_user !== undefined) settings.smtpUser = data.smtp_user
    if (data.smtp_password && data.smtp_password !== '********') settings.smtpPassword = data.smtp_password
    if (data.from_email !== undefined) settings.fromEmail = data.from_email
    if (data.from_name !== undefined) settings.fromName = data.from_name

    // Update provider
    if (data.provider !== undefined) settings.provider = data.provider
    if (data.resend_api_key && data.resend_api_key !== '********') settings.resendApiKey = data.resend_api_key

    // Update global settings
    if (data.emails_enabled !== undefined) settings.emailsEnabled = data.emails_enabled === 'true' || data.emails_enabled === true
    if (data.verification_email_enabled !== undefined) settings.verificationEmailEnabled = data.verification_email_enabled === 'true' || data.verification_email_enabled === true
    if (data.daily_mission_email_enabled !== undefined) settings.dailyMissionEmailEnabled = data.daily_mission_email_enabled === 'true' || data.daily_mission_email_enabled === true
    if (data.daily_mission_email_time !== undefined) settings.dailyMissionEmailTime = data.daily_mission_email_time

    // Update subjects
    if (data.welcome_email_subject !== undefined) settings.welcomeEmailSubject = data.welcome_email_subject
    if (data.verification_email_subject !== undefined) settings.verificationEmailSubject = data.verification_email_subject
    if (data.password_reset_email_subject !== undefined) settings.passwordResetEmailSubject = data.password_reset_email_subject
    if (data.daily_mission_email_subject !== undefined) settings.dailyMissionEmailSubject = data.daily_mission_email_subject

    // Update template contents
    if (data.verification_email_content !== undefined) settings.verificationEmailContent = data.verification_email_content
    if (data.welcome_email_content !== undefined) settings.welcomeEmailContent = data.welcome_email_content
    if (data.password_reset_email_content !== undefined) settings.passwordResetEmailContent = data.password_reset_email_content
    if (data.daily_mission_email_content !== undefined) settings.dailyMissionEmailContent = data.daily_mission_email_content

    // Update account changes email
    if (data.account_changes_email_enabled !== undefined) settings.accountChangesEmailEnabled = data.account_changes_email_enabled === 'true' || data.account_changes_email_enabled === true
    if (data.account_changes_email_subject !== undefined) settings.accountChangesEmailSubject = data.account_changes_email_subject
    if (data.account_changes_email_content !== undefined) settings.accountChangesEmailContent = data.account_changes_email_content

    // Update weekly summary email
    if (data.weekly_summary_email_enabled !== undefined) settings.weeklySummaryEmailEnabled = data.weekly_summary_email_enabled === 'true' || data.weekly_summary_email_enabled === true
    if (data.weekly_summary_email_subject !== undefined) settings.weeklySummaryEmailSubject = data.weekly_summary_email_subject
    if (data.weekly_summary_email_content !== undefined) settings.weeklySummaryEmailContent = data.weekly_summary_email_content

    await settings.save()

    // Clear email service cache
    this.emailService.clearCache()

    session.flash('success', 'Parametres email mis a jour avec succes.')
    return response.redirect('/admin/emails')
  }

  /**
   * Send test email
   */
  async sendTest({ request, response, session }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      session.flash('error', 'Veuillez entrer une adresse email.')
      return response.redirect('/admin/emails')
    }

    const success = await this.emailService.sendTestEmail(email)

    if (success) {
      session.flash('success', `Email de test envoye a ${email}`)
    } else {
      session.flash('error', 'Echec de l\'envoi. Verifiez la configuration.')
    }

    return response.redirect('/admin/emails')
  }
}
