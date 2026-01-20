import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_settings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // SMTP Configuration
      table.string('smtp_host').defaultTo('')
      table.integer('smtp_port').defaultTo(587)
      table.boolean('smtp_secure').defaultTo(false)
      table.string('smtp_user').defaultTo('')
      table.string('smtp_password').defaultTo('')
      table.string('from_email').defaultTo('noreply@lephare.fr')
      table.string('from_name').defaultTo('Le Phare')

      // Or use Resend API
      table.string('resend_api_key').defaultTo('')
      table.enum('provider', ['smtp', 'resend']).defaultTo('smtp')

      // Global email settings
      table.boolean('emails_enabled').defaultTo(true)
      table.boolean('verification_email_enabled').defaultTo(true)
      table.boolean('daily_mission_email_enabled').defaultTo(true)
      table.string('daily_mission_email_time', 5).defaultTo('10:00')

      // Email templates customization
      table.text('welcome_email_subject').defaultTo('Bienvenue sur Le Phare !')
      table.text('verification_email_subject').defaultTo('Confirmez votre adresse email')
      table.text('password_reset_email_subject').defaultTo('Réinitialisez votre mot de passe')
      table.text('daily_mission_email_subject').defaultTo('Votre mission du jour vous attend !')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })

    // Insert default settings
    this.defer(async (db) => {
      await db.table('email_settings').insert({
        id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      })
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
