import vine from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

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

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    password: vine.string(),
  })
)
