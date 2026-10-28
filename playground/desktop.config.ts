import { defineDesktopConfig } from '@owdproject/core'

export default defineDesktopConfig({
  theme: '@owdproject/theme-nova',
  modules: [
    '@owdproject/nuxt-atproto',
    '@owdproject/nuxt-atproto-persistence'
  ],
  apps: ['@owdproject/app-todo'],
  systemBar: { enabled: true, startButton: true },
})
