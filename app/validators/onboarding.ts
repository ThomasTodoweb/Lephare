import vine, { SimpleMessagesProvider } from '@vinejs/vine'
import { FieldContext } from '@vinejs/vine/types'
import db from '@adonisjs/lucid/services/db'

/**
 * French validation messages for onboarding
 */
const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est requis',
  'number': 'Ce champ doit être un nombre',
  'enum': 'Veuillez sélectionner une option valide',
  'strategy_id.required': 'Veuillez sélectionner une stratégie',
  'strategy_id.exists': 'Cette stratégie n\'existe pas',
  'publication_rhythm.required': 'Veuillez sélectionner un rythme de publication',
})

/**
 * Custom rule to check strategy exists in database
 */
const strategyExists = vine.createRule(async (value: unknown, _options: undefined, field: FieldContext) => {
  if (typeof value !== 'number') return

  const row = await db.from('strategies').where('id', value).where('is_active', true).first()

  if (!row) {
    field.report('Cette stratégie n\'existe pas', 'exists', field)
  }
})

export const strategyValidator = vine.compile(
  vine.object({
    strategy_id: vine.number().use(strategyExists()),
  })
)
strategyValidator.messagesProvider = messages

export const rhythmValidator = vine.compile(
  vine.object({
    publication_rhythm: vine.enum(['once_week', 'three_week', 'five_week', 'daily']),
  })
)
rhythmValidator.messagesProvider = messages
