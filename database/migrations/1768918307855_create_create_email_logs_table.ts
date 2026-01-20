import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Recipient info
      table.string('to_email').notNullable()
      table.string('to_name').nullable()

      // Email details
      table.string('subject').notNullable()
      table.string('email_type').notNullable() // verification, welcome, password_reset, daily_mission, test
      table.string('provider').notNullable() // smtp, resend

      // Status tracking
      table.enum('status', ['pending', 'sent', 'failed', 'bounced', 'complained']).defaultTo('pending')
      table.text('error_message').nullable()
      table.string('error_code').nullable()

      // Provider response
      table.string('provider_message_id').nullable() // ID returned by provider
      table.json('provider_response').nullable() // Full response for debugging

      // Related entities
      table.integer('user_id').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')

      // Timestamps
      table.timestamp('sent_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      // Indexes for faster queries
      table.index(['to_email'])
      table.index(['email_type'])
      table.index(['status'])
      table.index(['created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
