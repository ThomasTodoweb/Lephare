import { defineConfig } from 'vite'
import { getDirname } from '@adonisjs/core/helpers'
import inertia from '@adonisjs/inertia/client'
import react from '@vitejs/plugin-react'
import adonisjs from '@adonisjs/vite/client'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    inertia({ ssr: { enabled: false } }),
    react(),
    adonisjs({ entrypoints: ['inertia/app/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  /**
   * Define aliases for importing modules from
   * your frontend code
   */
  resolve: {
    alias: {
      '~/': `${getDirname(import.meta.url)}/inertia/`,
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk: React ecosystem
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react'
            }
            if (id.includes('@inertiajs')) {
              return 'vendor-inertia'
            }
            // lucide-react bundled with components that use it (layout, admin)
            // Other node_modules in a shared vendor chunk
            return 'vendor'
          }

          // UI Components chunk
          if (id.includes('/inertia/components/ui/')) {
            return 'ui-components'
          }

          // Layout components chunk
          if (id.includes('/inertia/components/layout/')) {
            return 'layout'
          }

          // Don't use manualChunks for pages - let Vite handle them naturally
          // so each page gets its own manifest entry for Inertia to resolve
        },
      },
    },
    chunkSizeWarningLimit: 500, // React 19 + react-dom + scheduler = ~430KB
  },
})
