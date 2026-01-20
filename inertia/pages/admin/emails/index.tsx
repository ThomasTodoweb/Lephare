import { Head, Link, useForm, usePage } from '@inertiajs/react'
import { AdminLayout } from '~/components/layout'
import { Card, Button, Input } from '~/components/ui'
import { useState } from 'react'

interface PageProps {
  settings: {
    // SMTP
    smtpHost: string
    smtpPort: number
    smtpSecure: boolean
    smtpUser: string
    smtpPasswordSet: boolean
    fromEmail: string
    fromName: string

    // Provider
    provider: 'smtp' | 'resend'
    resendApiKeySet: boolean

    // Global settings
    emailsEnabled: boolean
    verificationEmailEnabled: boolean
    dailyMissionEmailEnabled: boolean
    dailyMissionEmailTime: string

    // Subjects
    welcomeEmailSubject: string
    verificationEmailSubject: string
    passwordResetEmailSubject: string
    dailyMissionEmailSubject: string

    // Template contents
    verificationEmailContent: string
    welcomeEmailContent: string
    passwordResetEmailContent: string
    dailyMissionEmailContent: string

    // Account changes email
    accountChangesEmailEnabled: boolean
    accountChangesEmailSubject: string
    accountChangesEmailContent: string

    // Weekly summary email
    weeklySummaryEmailEnabled: boolean
    weeklySummaryEmailSubject: string
    weeklySummaryEmailContent: string
  }
  flash?: {
    success?: string
    error?: string
  }
}

export default function AdminEmailsIndex() {
  const { settings, flash } = usePage<PageProps>().props
  const [showSmtpPassword, setShowSmtpPassword] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'templates'>('config')

  const { data, setData, post, processing } = useForm({
    smtp_host: settings.smtpHost,
    smtp_port: settings.smtpPort.toString(),
    smtp_secure: settings.smtpSecure,
    smtp_user: settings.smtpUser,
    smtp_password: settings.smtpPasswordSet ? '********' : '',
    from_email: settings.fromEmail,
    from_name: settings.fromName,
    provider: settings.provider,
    resend_api_key: settings.resendApiKeySet ? '********' : '',
    emails_enabled: settings.emailsEnabled,
    verification_email_enabled: settings.verificationEmailEnabled,
    daily_mission_email_enabled: settings.dailyMissionEmailEnabled,
    daily_mission_email_time: settings.dailyMissionEmailTime,
    welcome_email_subject: settings.welcomeEmailSubject,
    verification_email_subject: settings.verificationEmailSubject,
    password_reset_email_subject: settings.passwordResetEmailSubject,
    daily_mission_email_subject: settings.dailyMissionEmailSubject,
    verification_email_content: settings.verificationEmailContent,
    welcome_email_content: settings.welcomeEmailContent,
    password_reset_email_content: settings.passwordResetEmailContent,
    daily_mission_email_content: settings.dailyMissionEmailContent,
    account_changes_email_enabled: settings.accountChangesEmailEnabled,
    account_changes_email_subject: settings.accountChangesEmailSubject,
    account_changes_email_content: settings.accountChangesEmailContent,
    weekly_summary_email_enabled: settings.weeklySummaryEmailEnabled,
    weekly_summary_email_subject: settings.weeklySummaryEmailSubject,
    weekly_summary_email_content: settings.weeklySummaryEmailContent,
  })

  const testForm = useForm({
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    post('/admin/emails')
  }

  const handleTestEmail = (e: React.FormEvent) => {
    e.preventDefault()
    testForm.post('/admin/emails/test')
  }

  return (
    <AdminLayout title="Configuration Emails">
      <Head title="Configuration Emails - Admin Le Phare" />

      {/* Flash messages */}
      {flash?.success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
          {flash.success}
        </div>
      )}
      {flash?.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
          {flash.error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'config'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Configuration
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'templates'
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Templates
          </button>
        </div>
        <Link
          href="/admin/email-logs"
          className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Historique
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {activeTab === 'config' && (
          <>
            {/* Global Settings */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Parametres globaux</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="emails_enabled"
                    checked={data.emails_enabled}
                    onChange={(e) => setData('emails_enabled', e.target.checked)}
                    className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="emails_enabled" className="text-sm text-neutral-700">
                    Activer l'envoi d'emails
                  </label>
                </div>

                {!data.emails_enabled && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                    Quand les emails sont desactives, les utilisateurs peuvent s'inscrire sans verification email.
                  </div>
                )}
              </div>
            </Card>

            {/* Provider Selection */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Fournisseur d'email</h2>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="smtp"
                      checked={data.provider === 'smtp'}
                      onChange={() => setData('provider', 'smtp')}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">SMTP</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="provider"
                      value="resend"
                      checked={data.provider === 'resend'}
                      onChange={() => setData('provider', 'resend')}
                      className="w-4 h-4 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-neutral-700">Resend (API)</span>
                  </label>
                </div>

                {data.provider === 'resend' && (
                  <div className="pt-4 border-t border-neutral-100">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Cle API Resend
                    </label>
                    <div className="relative">
                      <Input
                        type={showApiKey ? 'text' : 'password'}
                        value={data.resend_api_key}
                        onChange={(e) => setData('resend_api_key', e.target.value)}
                        placeholder="re_xxxxxxxx"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showApiKey ? '🙈' : '👁️'}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Obtenez votre cle API sur{' '}
                      <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        resend.com
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* SMTP Settings */}
            {data.provider === 'smtp' && (
              <Card>
                <h2 className="text-lg font-bold text-neutral-900 mb-4">Configuration SMTP</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Serveur SMTP</label>
                    <Input
                      type="text"
                      value={data.smtp_host}
                      onChange={(e) => setData('smtp_host', e.target.value)}
                      placeholder="smtp.example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Port</label>
                    <Input
                      type="number"
                      value={data.smtp_port}
                      onChange={(e) => setData('smtp_port', e.target.value)}
                      placeholder="587"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Utilisateur</label>
                    <Input
                      type="text"
                      value={data.smtp_user}
                      onChange={(e) => setData('smtp_user', e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Mot de passe</label>
                    <div className="relative">
                      <Input
                        type={showSmtpPassword ? 'text' : 'password'}
                        value={data.smtp_password}
                        onChange={(e) => setData('smtp_password', e.target.value)}
                        placeholder="********"
                        className="pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showSmtpPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="smtp_secure"
                      checked={data.smtp_secure}
                      onChange={(e) => setData('smtp_secure', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="smtp_secure" className="text-sm text-neutral-700">
                      Utiliser SSL/TLS (port 465)
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* Sender Settings */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Expediteur</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Nom d'expediteur</label>
                  <Input
                    type="text"
                    value={data.from_name}
                    onChange={(e) => setData('from_name', e.target.value)}
                    placeholder="Le Phare"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Email d'expediteur</label>
                  <Input
                    type="email"
                    value={data.from_email}
                    onChange={(e) => setData('from_email', e.target.value)}
                    placeholder="noreply@lephare.fr"
                  />
                </div>
              </div>
            </Card>

            {/* Email Types - only subjects and toggles */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-4">Types d'emails</h2>

              <div className="space-y-6">
                {/* Verification Email */}
                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="verification_email_enabled"
                      checked={data.verification_email_enabled}
                      onChange={(e) => setData('verification_email_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="verification_email_enabled" className="text-sm font-medium text-neutral-700">
                      Email de verification (inscription)
                    </label>
                  </div>
                  <Input
                    type="text"
                    value={data.verification_email_subject}
                    onChange={(e) => setData('verification_email_subject', e.target.value)}
                    placeholder="Sujet de l'email"
                    disabled={!data.verification_email_enabled}
                  />
                </div>

                {/* Welcome Email */}
                <div className="pb-4 border-b border-neutral-100">
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Email de bienvenue (apres verification)
                  </label>
                  <Input
                    type="text"
                    value={data.welcome_email_subject}
                    onChange={(e) => setData('welcome_email_subject', e.target.value)}
                    placeholder="Sujet de l'email"
                  />
                </div>

                {/* Password Reset Email */}
                <div className="pb-4 border-b border-neutral-100">
                  <label className="block text-sm font-medium text-neutral-700 mb-3">
                    Email de reinitialisation de mot de passe
                  </label>
                  <Input
                    type="text"
                    value={data.password_reset_email_subject}
                    onChange={(e) => setData('password_reset_email_subject', e.target.value)}
                    placeholder="Sujet de l'email"
                  />
                </div>

                {/* Daily Mission Email */}
                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="daily_mission_email_enabled"
                      checked={data.daily_mission_email_enabled}
                      onChange={(e) => setData('daily_mission_email_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="daily_mission_email_enabled" className="text-sm font-medium text-neutral-700">
                      Email de mission quotidienne
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      type="text"
                      value={data.daily_mission_email_subject}
                      onChange={(e) => setData('daily_mission_email_subject', e.target.value)}
                      placeholder="Sujet de l'email"
                      disabled={!data.daily_mission_email_enabled}
                    />
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">Heure d'envoi par defaut</label>
                      <Input
                        type="time"
                        value={data.daily_mission_email_time}
                        onChange={(e) => setData('daily_mission_email_time', e.target.value)}
                        disabled={!data.daily_mission_email_enabled}
                      />
                    </div>
                  </div>
                </div>

                {/* Account Changes Email */}
                <div className="pb-4 border-b border-neutral-100">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="account_changes_email_enabled"
                      checked={data.account_changes_email_enabled}
                      onChange={(e) => setData('account_changes_email_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="account_changes_email_enabled" className="text-sm font-medium text-neutral-700">
                      Email de modification de compte
                    </label>
                  </div>
                  <Input
                    type="text"
                    value={data.account_changes_email_subject}
                    onChange={(e) => setData('account_changes_email_subject', e.target.value)}
                    placeholder="Sujet de l'email"
                    disabled={!data.account_changes_email_enabled}
                  />
                </div>

                {/* Weekly Summary Email */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id="weekly_summary_email_enabled"
                      checked={data.weekly_summary_email_enabled}
                      onChange={(e) => setData('weekly_summary_email_enabled', e.target.checked)}
                      className="w-5 h-5 rounded border-neutral-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="weekly_summary_email_enabled" className="text-sm font-medium text-neutral-700">
                      Email de bilan hebdomadaire
                    </label>
                  </div>
                  <Input
                    type="text"
                    value={data.weekly_summary_email_subject}
                    onChange={(e) => setData('weekly_summary_email_subject', e.target.value)}
                    placeholder="Sujet de l'email"
                    disabled={!data.weekly_summary_email_enabled}
                  />
                </div>
              </div>
            </Card>
          </>
        )}

        {activeTab === 'templates' && (
          <>
            {/* Variables info */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Variables disponibles</h2>
              <p className="text-sm text-neutral-600 mb-4">
                Utilisez ces variables dans vos templates. Elles seront remplacees automatiquement.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{prenom}'}</code> - Prenom de l'utilisateur</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{code}'}</code> - Code de verification</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{restaurant}'}</code> - Nom du restaurant</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{titre}'}</code> - Titre de la mission</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{description}'}</code> - Description mission</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{categorie}'}</code> - Categorie mission</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{modification}'}</code> - Type de modification</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{date}'}</code> - Date de modification</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{missions_completees}'}</code> - Missions completees</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{missions_total}'}</code> - Total missions</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{streak}'}</code> - Streak actuel</div>
                <div className="bg-neutral-50 p-2 rounded"><code className="text-primary">{'{analyse_ia}'}</code> - Analyse IA</div>
              </div>
            </Card>

            {/* Verification Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de verification</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye a l'inscription pour verifier l'adresse email. Variables: {'{prenom}'}, {'{code}'}
              </p>
              <textarea
                value={data.verification_email_content}
                onChange={(e) => setData('verification_email_content', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>

            {/* Welcome Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de bienvenue</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye apres la verification de l'email. Variables: {'{prenom}'}
              </p>
              <textarea
                value={data.welcome_email_content}
                onChange={(e) => setData('welcome_email_content', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>

            {/* Password Reset Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de reinitialisation mot de passe</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye quand l'utilisateur demande a reinitialiser son mot de passe. Variables: {'{prenom}'}
                <br />
                <span className="text-yellow-600">Note: Le bouton de reinitialisation est ajoute automatiquement.</span>
              </p>
              <textarea
                value={data.password_reset_email_content}
                onChange={(e) => setData('password_reset_email_content', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>

            {/* Daily Mission Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de mission quotidienne</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye chaque jour pour rappeler la mission. Variables: {'{prenom}'}, {'{restaurant}'}, {'{titre}'}, {'{description}'}, {'{categorie}'}
              </p>
              <textarea
                value={data.daily_mission_email_content}
                onChange={(e) => setData('daily_mission_email_content', e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>

            {/* Account Changes Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de modification de compte</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye quand l'utilisateur modifie ses informations de compte. Variables: {'{prenom}'}, {'{modification}'}, {'{date}'}
              </p>
              <textarea
                value={data.account_changes_email_content}
                onChange={(e) => setData('account_changes_email_content', e.target.value)}
                rows={10}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>

            {/* Weekly Summary Email Template */}
            <Card>
              <h2 className="text-lg font-bold text-neutral-900 mb-2">Email de bilan hebdomadaire</h2>
              <p className="text-xs text-neutral-500 mb-3">
                Envoye chaque lundi matin avec le bilan de la semaine. Variables: {'{prenom}'}, {'{restaurant}'}, {'{missions_completees}'}, {'{missions_total}'}, {'{streak}'}, {'{analyse_ia}'}
              </p>
              <textarea
                value={data.weekly_summary_email_content}
                onChange={(e) => setData('weekly_summary_email_content', e.target.value)}
                rows={12}
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-mono text-sm"
                placeholder="Contenu de l'email..."
              />
            </Card>
          </>
        )}

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={processing}>
          {processing ? 'Enregistrement...' : 'Enregistrer les parametres'}
        </Button>
      </form>

      {/* Test Email */}
      <Card className="mt-6">
        <h2 className="text-lg font-bold text-neutral-900 mb-4">Tester la configuration</h2>

        <form onSubmit={handleTestEmail} className="flex gap-3">
          <Input
            type="email"
            value={testForm.data.email}
            onChange={(e) => testForm.setData('email', e.target.value)}
            placeholder="votre@email.com"
            className="flex-1"
            required
          />
          <Button type="submit" variant="outlined" disabled={testForm.processing}>
            {testForm.processing ? 'Envoi...' : 'Envoyer un test'}
          </Button>
        </form>

        <p className="text-xs text-neutral-500 mt-2">
          Envoie un email de test pour verifier que la configuration fonctionne.
        </p>
      </Card>
    </AdminLayout>
  )
}
