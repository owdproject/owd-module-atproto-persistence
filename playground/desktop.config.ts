import { defineDesktopConfig } from '@owdproject/nuxt'

export default defineDesktopConfig({
  theme: '@owdproject/nuxt-theme-paper',
  modules: [
    '@owdproject/nuxt-module-atproto',
    '@owdproject/nuxt-module-atproto-persistence'
  ],
  apps: ['@owdproject/nuxt-app-todo'],
  systemBar: { enabled: true, startButton: true },
})
