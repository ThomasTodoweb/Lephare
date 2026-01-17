import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

/**
 * French validation messages
 */
const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est requis',
  'string': 'Ce champ doit être une chaîne de caractères',
  'email': 'Veuillez entrer un email valide',
  'minLength': 'Ce champ doit contenir au moins {{ min }} caractères',
  'sameAs': 'Les mots de passe ne correspondent pas',
  'unique': 'Cet email est déjà utilisé',
})

/**
 * Custom rule to check unique email in database
 */
const uniqueEmail = vine.createRule(async (value: unknown, _options: undefined, field: FieldContext) => {
  if (typeof value !== 'string') return

  const row = await db.from('users').where('email', value).first()

  if (row) {
    field.report('Cet email est déjà utilisé', 'unique', field)
  }
})

export const registerValidator = vine.compile(
  vine.object({
    email: vine.string().email().use(uniqueEmail()),
    password: vine.string().minLength(8),
    password_confirmation: vine.string().sameAs('password'),
  })
)
registerValidator.messagesProvider = messages

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)
loginValidator.messagesProvider = messages
