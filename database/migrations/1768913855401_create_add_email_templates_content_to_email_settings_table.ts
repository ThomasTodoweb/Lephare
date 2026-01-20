import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'email_settings'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Email template contents (editable from admin)
      table.text('verification_email_content').defaultTo(`Bonjour {prenom},

Bienvenue sur Le Phare ! Pour terminer votre inscription, entrez ce code de verification :

{code}

Ce code expire dans 15 minutes.

Si vous n'avez pas cree de compte sur Le Phare, ignorez simplement cet email.`)

      table.text('welcome_email_content').defaultTo(`Bonjour {prenom},

Votre compte est maintenant actif ! Vous etes pret a booster votre presence Instagram.

Voici ce que vous pouvez faire avec Le Phare :
- Recevoir des missions quotidiennes adaptees a votre restaurant
- Connecter votre compte Instagram pour publier facilement
- Suivre vos statistiques et votre progression

A tres vite sur Le Phare !`)

      table.text('password_reset_email_content').defaultTo(`Bonjour {prenom},

Vous avez demande a reinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe.

Ce lien expire dans 1 heure.

Si vous n'avez pas demande cette reinitialisation, ignorez cet email. Votre mot de passe actuel restera inchange.`)

      table.text('daily_mission_email_content').defaultTo(`Bonjour {prenom},

Une nouvelle mission vous attend{restaurant} !

Mission : {titre}
{description}

Categorie : {categorie}

Vous recevez cet email car les notifications par email sont activees. Vous pouvez les desactiver dans vos parametres.`)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('verification_email_content')
      table.dropColumn('welcome_email_content')
      table.dropColumn('password_reset_email_content')
      table.dropColumn('daily_mission_email_content')
    })
  }
}
