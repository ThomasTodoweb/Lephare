import env from '#start/env'
import { defineConfig, services } from '@adonisjs/ally'

const allyConfig = defineConfig({
  google: services.google({
    clientId: env.get('GOOGLE_CLIENT_ID') || '',
    clientSecret: env.get('GOOGLE_CLIENT_SECRET') || '',
    callbackUrl: env.get('GOOGLE_CALLBACK_URL', 'http://localhost:3333/auth/google/callback'),
  }),
  // Apple Sign In uses custom implementation since @adonisjs/ally doesn't have built-in support
  // See SocialAuthController for Apple auth handling
})

export default allyConfig

declare module '@adonisjs/ally/types' {
  interface SocialProviders extends InferSocialProviders<typeof allyConfig> {}
}
