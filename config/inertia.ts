import { defineConfig } from '@adonisjs/inertia'
import type { InferSharedProps } from '@adonisjs/inertia/types'

const inertiaConfig = defineConfig({
  /**
   * Path to the Edge view that will be used as the root view for Inertia responses
   */
  rootView: 'inertia_layout',

  /**
   * Data that should be shared with all rendered pages
   */
  sharedData: {
    user: (ctx) => ctx.auth?.user?.serialize() ?? null,
    flash: (ctx) => ctx.session?.flashMessages?.all() ?? {},
    errors: (ctx) => ctx.session?.flashMessages?.get('errors') ?? null,
    unreadNotificationsCount: async (ctx) => {
      if (!ctx.auth?.user) return 0
      const { default: InAppNotificationService } = await import('#services/in_app_notification_service')
      const service = new InAppNotificationService()
      return service.countUnread(ctx.auth.user.id)
    },
  },

  /**
   * Options for the server-side rendering
   */
  ssr: {
    enabled: false,
    entrypoint: 'inertia/app/ssr.tsx'
  }
})

export default inertiaConfig

declare module '@adonisjs/inertia/types' {
  export interface SharedProps extends InferSharedProps<typeof inertiaConfig> {}
}