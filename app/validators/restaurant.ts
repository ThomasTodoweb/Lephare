import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * French validation messages for restaurant
 */
const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est requis',
  'string': 'Ce champ doit être une chaîne de caractères',
  'minLength': 'Ce champ doit contenir au moins {{ min }} caractères',
  'maxLength': 'Ce champ ne peut pas dépasser {{ max }} caractères',
  'enum': 'Veuillez sélectionner un type de restaurant',
  'name.required': 'Le nom du restaurant est requis',
  'type.required': 'Veuillez sélectionner un type de restaurant',
  'city.required': 'La ville est requise',
})

export const restaurantTypeValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100),
    type: vine.enum(['brasserie', 'gastronomique', 'fast_food', 'pizzeria', 'cafe_bar', 'autre']),
    city: vine.string().minLength(2).maxLength(100),
  })
)
restaurantTypeValidator.messagesProvider = messages
