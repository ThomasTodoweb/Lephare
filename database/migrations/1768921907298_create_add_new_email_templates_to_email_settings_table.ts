import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Account changes email
      table.boolean('account_changes_email_enabled').defaultTo(true)
      table.string('account_changes_email_subject', 255).defaultTo('Modification de votre compte Le Phare')
      table.text('account_changes_email_content').defaultTo(
        `Bonjour {prenom},

Nous vous informons qu'une modification a ete effectuee sur votre compte Le Phare.

Modification: {modification}
Date: {date}

Si vous n'etes pas a l'origine de cette modification, veuillez nous contacter immediatement.

L'equipe Le Phare`
      )

      // Weekly summary email
      table.boolean('weekly_summary_email_enabled').defaultTo(true)
      table.string('weekly_summary_email_subject', 255).defaultTo('Votre bilan de la semaine - Le Phare')
      table.text('weekly_summary_email_content').defaultTo(
        `Bonjour {prenom},

Voici le bilan de votre semaine sur Le Phare !

{restaurant}

MISSIONS COMPLETEES: {missions_completees}/{missions_total}
STREAK ACTUEL: {streak} jours

{analyse_ia}

Continue comme ca ! Chaque mission te rapproche de tes objectifs Instagram.

A la semaine prochaine,
L'equipe Le Phare`
      )
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('account_changes_email_enabled')
      table.dropColumn('account_changes_email_subject')
      table.dropColumn('account_changes_email_content')
      table.dropColumn('weekly_summary_email_enabled')
      table.dropColumn('weekly_summary_email_subject')
      table.dropColumn('weekly_summary_email_content')
    })
  }
}
