import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import MissionTemplate from './mission_template.js'

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

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => MissionTemplate)
  declare missionTemplate: BelongsTo<typeof MissionTemplate>

  /**
   * Check if the mission is for today
   */
  isToday(): boolean {
    const today = DateTime.now().startOf('day')
    return this.assignedAt.startOf('day').equals(today)
  }

  /**
   * Check if pass/reload can still be used today
   */
  canUsePassOrReload(): boolean {
    return this.isToday() && !this.usedPass && !this.usedReload && this.status === 'pending'
  }
}
