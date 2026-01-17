import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * French validation messages for onboarding
 */
const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est requis',
  'number': 'Ce champ doit être un nombre',
  'enum': 'Veuillez sélectionner une option valide',
  'strategy_id.required': 'Veuillez sélectionner une stratégie',
  'publication_rhythm.required': 'Veuillez sélectionner un rythme de publication',
})

export const strategyValidator = vine.compile(
  vine.object({
    strategy_id: vine.number(),
  })
)
strategyValidator.messagesProvider = messages

export const rhythmValidator = vine.compile(
  vine.object({
    publication_rhythm: vine.enum(['once_week', 'three_week', 'five_week', 'daily']),
  })
)
rhythmValidator.messagesProvider = messages
