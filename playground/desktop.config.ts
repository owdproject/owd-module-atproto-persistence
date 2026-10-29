import { defineDesktopConfig } from '@owdproject/nuxt'

export default defineDesktopConfig({
  theme: '@owdproject/theme-nuxt-nova',
  modules: [
    '@owdproject/module-nuxt-atproto',
    '@owdproject/module-nuxt-atproto-persistence'
  ],
  apps: ['@owdproject/app-nuxt-todo'],
  systemBar: { enabled: true, startButton: true },
})
