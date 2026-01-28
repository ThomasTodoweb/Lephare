import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MissionTemplate from './mission_template.js'
import type { RestaurantType } from './restaurant.js'
import type { MissionType } from './mission_template.js'

/**
 * Content types that an idea can apply to
 * (post, story, reel, carousel - excluding tuto and engagement)
 */
export type ContentType = 'post' | 'carousel' | 'story' | 'reel'

export default class ContentIdea extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  /**
   * Title for the idea (for admin display)
   */
  @column()
  declare title: string | null

  /**
   * Legacy: link to specific mission template (deprecated, kept for compatibility)
   */
  @column()
  declare missionTemplateId: number | null

  @column()
  declare suggestionText: string

  @column()
  declare photoTips: string | null

  @column()
  declare isActive: boolean

  /**
   * Restaurant types this idea applies to.
   * If null or empty, applies to ALL restaurant types.
   */
  @column({
    prepare: (value: RestaurantType[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null
      // Handle already parsed arrays (from Postgres JSON type)
      if (Array.isArray(value)) return value
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : null
      } catch {
        // If not valid JSON, try comma-separated string
        if (typeof value === 'string' && value.includes(',')) {
          return value.split(',').map((s) => s.trim()).filter(Boolean)
        }
        // Single value
        if (typeof value === 'string' && value.trim()) {
          return [value.trim()]
        }
        return null
      }
    },
  })
  declare restaurantTags: RestaurantType[] | null

  /**
   * Content types this idea applies to (post, story, reel, carousel).
   * If null or empty, applies to ALL content types.
   */
  @column({
    prepare: (value: ContentType[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null
      if (Array.isArray(value)) return value
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : null
      } catch {
        if (typeof value === 'string' && value.includes(',')) {
          return value.split(',').map((s) => s.trim()).filter(Boolean)
        }
        if (typeof value === 'string' && value.trim()) {
          return [value.trim()]
        }
        return null
      }
    },
  })
  declare contentTypes: ContentType[] | null

  /**
   * Thematic category IDs this idea applies to.
   * If null or empty, applies to ALL categories.
   */
  @column({
    prepare: (value: number[] | null) => (value ? JSON.stringify(value) : null),
    consume: (value: string | null) => {
      if (!value) return null
      if (Array.isArray(value)) return value.map(Number)
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed.map(Number) : null
      } catch {
        if (typeof value === 'string' && value.includes(',')) {
          return value.split(',').map((s) => Number(s.trim())).filter((n) => !isNaN(n))
        }
        const num = Number(value)
        if (!isNaN(num)) return [num]
        return null
      }
    },
  })
  declare thematicCategoryIds: number[] | null

  /**
   * Path to example media file (image or video) for visual inspiration
   */
  @column()
  declare exampleMediaPath: string | null

  /**
   * Type of example media: 'image' or 'video'
   */
  @column()
  declare exampleMediaType: 'image' | 'video' | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * Legacy relationship (deprecated)
   */
  @belongsTo(() => MissionTemplate)
  declare missionTemplate: BelongsTo<typeof MissionTemplate>

  /**
   * Check if this idea matches a given content type
   */
  matchesContentType(type: MissionType): boolean {
    // tuto and engagement don't use content ideas
    if (type === 'tuto' || type === 'engagement') return false
    // If no content types specified, matches all
    if (!this.contentTypes || this.contentTypes.length === 0) return true
    return this.contentTypes.includes(type as ContentType)
  }

  /**
   * Check if this idea matches a given thematic category
   */
  matchesThematicCategory(categoryId: number | null): boolean {
    // If mission has no category, show ALL ideas (no filtering by category)
    if (categoryId === null) return true
    // If idea has no category restriction, it matches all categories
    if (!this.thematicCategoryIds || this.thematicCategoryIds.length === 0) return true
    // Otherwise check if the category is in the idea's list
    return this.thematicCategoryIds.includes(categoryId)
  }

  /**
   * Check if this idea matches a given restaurant type
   */
  matchesRestaurantType(type: RestaurantType | null): boolean {
    // If idea has no restaurant type restriction, it matches all
    if (!this.restaurantTags || this.restaurantTags.length === 0) return true
    // If user has no restaurant type set, show ALL ideas (no filtering)
    if (type === null) return true
    // Otherwise check if the restaurant type is in the idea's list
    return this.restaurantTags.includes(type)
  }
}
