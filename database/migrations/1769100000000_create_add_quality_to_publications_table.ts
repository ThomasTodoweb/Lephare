import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'publications'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Quality score from AI analysis: green, yellow, red
      table.string('quality_score', 10).nullable()

      // Feedback message from AI
      table.text('quality_feedback').nullable()

      // When the analysis was done
      table.timestamp('quality_analyzed_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('quality_score')
      table.dropColumn('quality_feedback')
      table.dropColumn('quality_analyzed_at')
    })
  }
}
