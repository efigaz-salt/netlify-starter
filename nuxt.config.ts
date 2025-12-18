export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  app: {
    head: {
      title: 'Netlify Client Environment',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Netlify client environment simulation' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiUrl: process.env.API_URL || 'http://localhost:3000/api',
      sseUrl: process.env.SSE_FUNCTION_URL || '',
      environment: process.env.ENVIRONMENT || 'development'
    }
  },
  // Suppress Vue Router warnings for /api/* paths (handled by edge functions)
  vite: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => false
        }
      }
    }
  }
})