import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Admin middleware is used to restrict access to admin-only routes.
 * It requires the user to be authenticated and have the 'admin' role.
 */
export default class AdminMiddleware {
  /**
   * The URL to redirect to, when admin access is denied
   */
  redirectTo = '/dashboard'

  async handle(ctx: HttpContext, next: NextFn) {
    // User must be authenticated (handled by auth middleware before this)
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.redirect(this.redirectTo)
    }

    // Check if user has admin role
    if (user.role !== 'admin') {
      // Log unauthorized admin access attempt
      console.warn(`⚠️ Admin access denied for user ${user.id} (${user.email})`)

      // For API requests, return 403 Forbidden
      if (ctx.request.accepts(['html', 'json']) === 'json') {
        return ctx.response.forbidden({ error: 'Admin access required' })
      }

      // For web requests, redirect to dashboard
      return ctx.response.redirect(this.redirectTo)
    }

    return next()
  }
}
