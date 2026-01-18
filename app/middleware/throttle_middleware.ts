import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Simple in-memory rate limiter for auth routes
 * Protects against brute force attacks on login/register
 *
 * In production with multiple instances, use Redis-based limiter
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export default class ThrottleMiddleware {
  /**
   * Max attempts before blocking
   */
  private maxAttempts = 5

  /**
   * Window in milliseconds (15 minutes)
   */
  private windowMs = 15 * 60 * 1000

  async handle(ctx: HttpContext, next: NextFn) {
    const ip = ctx.request.ip()
    const key = `auth:${ip}`
    const now = Date.now()

    let entry = store.get(key)

    // Reset if window expired
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + this.windowMs }
      store.set(key, entry)
    }

    // Check if rate limited
    if (entry.count >= this.maxAttempts) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000)

      ctx.response.header('Retry-After', retryAfter.toString())
      ctx.response.header('X-RateLimit-Limit', this.maxAttempts.toString())
      ctx.response.header('X-RateLimit-Remaining', '0')
      ctx.response.header('X-RateLimit-Reset', entry.resetAt.toString())

      return ctx.response.tooManyRequests({
        error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.',
        retryAfter,
      })
    }

    // Increment counter
    entry.count++
    store.set(key, entry)

    // Set rate limit headers
    ctx.response.header('X-RateLimit-Limit', this.maxAttempts.toString())
    ctx.response.header('X-RateLimit-Remaining', (this.maxAttempts - entry.count).toString())
    ctx.response.header('X-RateLimit-Reset', entry.resetAt.toString())

    return next()
  }
}
