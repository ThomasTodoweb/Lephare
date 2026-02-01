import vine, { SimpleMessagesProvider } from '@vinejs/vine'

/**
 * French validation messages for admin forms
 */
const messages = new SimpleMessagesProvider({
  'required': 'Ce champ est requis',
  'string': 'Ce champ doit être une chaîne de caractères',
  'minLength': 'Ce champ doit contenir au moins {{ min }} caractères',
  'maxLength': 'Ce champ ne peut pas dépasser {{ max }} caractères',
  'number': 'Ce champ doit être un nombre',
  'boolean': 'Ce champ doit être un booléen',
  'regex': 'Format invalide',
})

/**
 * Strategy validation (FR41)
 */
export const createStrategyValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim(),
    slug: vine
      .string()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-z0-9-]+$/)
      .trim(),
    description: vine.string().maxLength(500).trim().optional(),
    icon: vine.string().maxLength(10).optional(),
    isActive: vine.boolean().optional(),
  })
)
createStrategyValidator.messagesProvider = messages

export const updateStrategyValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100).trim(),
    slug: vine
      .string()
      .minLength(2)
      .maxLength(50)
      .regex(/^[a-z0-9-]+$/)
      .trim(),
    description: vine.string().maxLength(500).trim().optional().nullable(),
    icon: vine.string().maxLength(10).optional(),
    isActive: vine.boolean().optional(),
  })
)
updateStrategyValidator.messagesProvider = messages

/**
 * Mission Template validation (FR44)
 * Type must match MissionType: 'post' | 'carousel' | 'story' | 'reel' | 'engagement'
 * Note: 'tuto' type is excluded - tutorials are managed separately via /admin/tutorials
 */
export const createTemplateValidator = vine.compile(
  vine.object({
    strategyId: vine.number().positive(),
    type: vine.enum(['post', 'carousel', 'story', 'reel', 'engagement'] as const),
    title: vine.string().minLength(3).maxLength(200).trim(),
    contentIdea: vine.string().maxLength(1000).trim().optional(),
    order: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
    tutorialId: vine.number().positive().optional().nullable(),
    requiredTutorialId: vine.number().positive().optional().nullable(),
    thematicCategoryId: vine.number().positive().optional().nullable(),
  })
)
createTemplateValidator.messagesProvider = messages

export const updateTemplateValidator = vine.compile(
  vine.object({
    strategyId: vine.number().positive(),
    type: vine.enum(['post', 'carousel', 'story', 'reel', 'engagement'] as const),
    title: vine.string().minLength(3).maxLength(200).trim(),
    contentIdea: vine.string().maxLength(1000).trim().optional().nullable(),
    order: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
    tutorialId: vine.number().positive().optional().nullable(),
    requiredTutorialId: vine.number().positive().optional().nullable(),
    thematicCategoryId: vine.number().positive().optional().nullable(),
    useRandomIdeaBackground: vine.boolean().optional(),
  })
)
updateTemplateValidator.messagesProvider = messages

/**
 * Tutorial validation (FR46) - matches the actual controller fields
 */
export const createTutorialValidator = vine.compile(
  vine.object({
    categoryId: vine.number().positive(),
    title: vine.string().minLength(3).maxLength(200).trim(),
    description: vine.string().maxLength(500).trim().optional(),
    videoUrl: vine.string().maxLength(500).optional().nullable(),
    contentText: vine.string().maxLength(10000).trim().optional(),
    durationMinutes: vine.number().positive().max(999).optional(),
    order: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)
createTutorialValidator.messagesProvider = messages

export const updateTutorialValidator = vine.compile(
  vine.object({
    categoryId: vine.number().positive(),
    title: vine.string().minLength(3).maxLength(200).trim(),
    description: vine.string().maxLength(500).trim().optional().nullable(),
    videoUrl: vine.string().maxLength(500).optional().nullable(),
    contentText: vine.string().maxLength(10000).trim().optional().nullable(),
    durationMinutes: vine.number().positive().max(999).optional(),
    order: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
  })
)
updateTutorialValidator.messagesProvider = messages

/**
 * Alert validation (FR48)
 * AlertType must match AlertsService: 'inactive' | 'streak_lost'
 */
export const sendAlertValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    alertType: vine.enum(['inactive', 'streak_lost'] as const),
  })
)
sendAlertValidator.messagesProvider = messages

export const sendBulkAlertsValidator = vine.compile(
  vine.object({
    userIds: vine.array(vine.number().positive()).minLength(1).maxLength(100),
    alertType: vine.enum(['inactive', 'streak_lost'] as const),
  })
)
sendBulkAlertsValidator.messagesProvider = messages

/**
 * Content Idea validation
 * Restaurant tags: array of restaurant type slugs (brasserie, gastronomique, etc.)
 * If empty/null, idea applies to all restaurant types
 */
const restaurantTypeEnum = vine.enum([
  'brasserie',
  'gastronomique',
  'fast_food',
  'pizzeria',
  'cafe_bar',
  'autre',
] as const)

export const createContentIdeaValidator = vine.compile(
  vine.object({
    missionTemplateId: vine.number().positive(),
    suggestionText: vine.string().minLength(3).maxLength(500).trim(),
    photoTips: vine.string().maxLength(500).trim().optional().nullable(),
    isActive: vine.boolean().optional(),
    restaurantTags: vine.array(restaurantTypeEnum).optional().nullable(),
  })
)
createContentIdeaValidator.messagesProvider = messages

export const updateContentIdeaValidator = vine.compile(
  vine.object({
    suggestionText: vine.string().minLength(3).maxLength(500).trim(),
    photoTips: vine.string().maxLength(500).trim().optional().nullable(),
    isActive: vine.boolean().optional(),
    restaurantTags: vine.array(restaurantTypeEnum).optional().nullable(),
  })
)
updateContentIdeaValidator.messagesProvider = messages
