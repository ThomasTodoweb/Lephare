import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import MissionTemplate from './mission_template.js'
import Publication from './publication.js'

export type MissionStatus = 'pending' | 'completed' | 'skipped'

export default class Mission extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare missionTemplateId: number

  @column()
  declare status: MissionStatus

  @column.dateTime()
  declare assignedAt: DateTime

  @column.dateTime()
  declare completedAt: DateTime | null

  @column()
  declare usedPass: boolean

  @column()
  declare usedReload: boolean

  @column()
  declare slotNumber: number

  @column()
  declare isRecommended: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => MissionTemplate)
  declare missionTemplate: BelongsTo<typeof MissionTemplate>

  @hasOne(() => Publication)
  declare publication: HasOne<typeof Publication>

  /**
   * Check if the mission is for today (using UTC for consistency)
   */
  isToday(): boolean {
    const today = DateTime.utc().startOf('day')
    return this.assignedAt.toUTC().startOf('day').equals(today)
  }

  /**
   * Check if pass/reload can still be used today
   */
  canUsePassOrReload(): boolean {
    return this.isToday() && !this.usedPass && !this.usedReload && this.status === 'pending'
  }
}
