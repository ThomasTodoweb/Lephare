import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

/**
 * Middleware to capture raw request body before bodyparser processes it.
 * Required for webhook signature verification (Stripe, etc.)
 */
export default class RawBodyMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const chunks: Buffer[] = []

    // Capture raw body from request stream
    await new Promise<void>((resolve, reject) => {
      ctx.request.request.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      ctx.request.request.on('end', () => {
        resolve()
      })
      ctx.request.request.on('error', reject)
    })

    const rawBody = Buffer.concat(chunks)

    // Store raw body in request for later use
    // @ts-expect-error - Adding custom property
    ctx.request.rawBody = rawBody

    return next()
  }
}
