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
  'maxLength': 'Ce champ ne doit pas dépasser {{ max }} caractères',
  'unique': 'Cet email est déjà utilisé',
  'enum': 'Valeur non valide',
})

/**
 * Custom rule to check unique email in database (excluding current user)
 */
const uniqueEmailExcept = vine.createRule(
  async (value: unknown, options: { userId: number }, field: FieldContext) => {
    if (typeof value !== 'string') return

    const row = await db
      .from('users')
      .where('email', value)
      .whereNot('id', options.userId)
      .first()

    if (row) {
      field.report('Cet email est déjà utilisé', 'unique', field)
    }
  }
)

/**
 * Validator for updating user email
 */
export const updateEmailValidator = vine.compile(
  vine.object({
    email: vine.string().email().maxLength(255),
  })
)
updateEmailValidator.messagesProvider = messages

/**
 * Create email validator with unique check excluding current user
 */
export function createUpdateEmailValidator(userId: number) {
  const validator = vine.compile(
    vine.object({
      email: vine.string().email().maxLength(255).use(uniqueEmailExcept({ userId })),
    })
  )
  validator.messagesProvider = messages
  return validator
}

/**
 * Validator for updating restaurant name
 */
export const updateRestaurantNameValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100),
  })
)
updateRestaurantNameValidator.messagesProvider = messages

/**
 * Validator for updating restaurant type
 */
export const updateRestaurantTypeValidator = vine.compile(
  vine.object({
    type: vine.enum(['brasserie', 'gastronomique', 'fast_food', 'pizzeria', 'cafe_bar', 'autre']),
  })
)
updateRestaurantTypeValidator.messagesProvider = messages

/**
 * Validator for updating publication rhythm
 */
export const updatePublicationRhythmValidator = vine.compile(
  vine.object({
    publication_rhythm: vine.enum(['once_week', 'three_week', 'five_week', 'daily']),
  })
)
updatePublicationRhythmValidator.messagesProvider = messages

/**
 * Validator for updating strategy (objective)
 */
export const updateStrategyValidator = vine.compile(
  vine.object({
    strategy_id: vine.number().positive(),
  })
)
updateStrategyValidator.messagesProvider = messages
