import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export type PlanType = 'free_trial' | 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare stripeCustomerId: string | null

  @column()
  declare stripeSubscriptionId: string | null

  @column()
  declare stripePriceId: string | null

  @column()
  declare planType: PlanType

  @column()
  declare status: SubscriptionStatus

  @column.dateTime()
  declare trialEndsAt: DateTime | null

  @column.dateTime()
  declare currentPeriodStart: DateTime | null

  @column.dateTime()
  declare currentPeriodEnd: DateTime | null

  @column.dateTime()
  declare canceledAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  /**
   * Check if subscription is active (including trial)
   */
  isActive(): boolean {
    return this.status === 'active' || this.status === 'trialing'
  }

  /**
   * Check if subscription is in trial period
   */
  isTrialing(): boolean {
    return this.status === 'trialing' && this.trialEndsAt !== null && this.trialEndsAt > DateTime.utc()
  }

  /**
   * Get days remaining in trial
   */
  trialDaysRemaining(): number {
    if (!this.trialEndsAt) return 0
    const days = Math.ceil(this.trialEndsAt.diff(DateTime.utc(), 'days').days)
    return Math.max(0, days)
  }
}
