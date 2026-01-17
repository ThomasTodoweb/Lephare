import vine from '@vinejs/vine'

export const restaurantTypeValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100),
    type: vine.enum(['brasserie', 'gastronomique', 'fast_food', 'pizzeria', 'cafe_bar', 'autre']),
  })
)
