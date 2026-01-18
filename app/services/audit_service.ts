import { DateTime } from 'luxon'

export type AuditAction =
  | 'user_view'
  | 'user_update'
  | 'user_suspend'
  | 'strategy_create'
  | 'strategy_update'
  | 'strategy_delete'
  | 'template_create'
  | 'template_update'
  | 'template_delete'
  | 'tutorial_create'
  | 'tutorial_update'
  | 'tutorial_delete'
  | 'alert_send'
  | 'alert_bulk_send'
  | 'report_export'

export interface AuditEntry {
  action: AuditAction
  adminId: number
  targetId?: number
  targetType?: string
  details?: Record<string, unknown>
  timestamp: string
}

/**
 * Simple in-memory audit logger for admin actions
 * In production, this should be persisted to database
 */
class AuditService {
  private entries: AuditEntry[] = []
  private maxEntries = 1000 // Keep last 1000 entries in memory

  /**
   * Log an admin action
   */
  log(
    action: AuditAction,
    adminId: number,
    options?: {
      targetId?: number
      targetType?: string
      details?: Record<string, unknown>
    }
  ): void {
    const entry: AuditEntry = {
      action,
      adminId,
      targetId: options?.targetId,
      targetType: options?.targetType,
      details: options?.details,
      timestamp: DateTime.utc().toISO() || '',
    }

    this.entries.unshift(entry)

    // Trim to max entries
    if (this.entries.length > this.maxEntries) {
      this.entries = this.entries.slice(0, this.maxEntries)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[AUDIT] ${entry.action} by admin:${adminId}`,
        options?.targetId ? `target:${options.targetType}:${options.targetId}` : '',
        options?.details ? JSON.stringify(options.details) : ''
      )
    }
  }

  /**
   * Get recent audit entries
   */
  getRecent(limit: number = 50): AuditEntry[] {
    return this.entries.slice(0, limit)
  }

  /**
   * Get entries for a specific admin
   */
  getByAdmin(adminId: number, limit: number = 50): AuditEntry[] {
    return this.entries.filter((e) => e.adminId === adminId).slice(0, limit)
  }

  /**
   * Get entries for a specific target
   */
  getByTarget(targetType: string, targetId: number, limit: number = 50): AuditEntry[] {
    return this.entries
      .filter((e) => e.targetType === targetType && e.targetId === targetId)
      .slice(0, limit)
  }
}

// Export singleton instance
export default new AuditService()
