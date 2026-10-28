import { createPersistedStatePlugin } from 'pinia-plugin-persistedstate-2'
import { defineNuxtPlugin } from 'nuxt/app'

function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  if (!obj1 || !obj2 || typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  if (keys1.length !== keys2.length) return false
  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }
  return true
}
import { useAtprotoSession, useAtprotoAgent } from '#imports'
import { get, set, del } from 'idb-keyval'
import {
  putAtprotoApplicationState,
  parseAtprotoStoreKey,
} from './utils/utilAtprotoApplicationStates'
import { ensureActorStatesLoaded } from './utils/utilAtprotoPersistenceLoad'

function mapStoreKey(key: string): string {
  if (key === 'desktop') {
    return 'owd/desktop'
  }
  if (key.startsWith('desktop/application/')) {
    return key.replace(/^desktop\/application\//, 'owd/application/')
  }
  if (key.startsWith('desktop/')) {
    return key.replace(/^desktop\//, 'owd/desktop/')
  }
  return key
}

export default defineNuxtPlugin({
  name: 'desktop-plugin-atproto-persistence',
  dependsOn: ['pinia', 'atproto'],
  enforce: 'pre',
  async setup(nuxtApp) {
    const pinia = nuxtApp.$pinia
    if (!pinia) {
      return
    }

    // Block Nuxt initialization until the remote states are fetched
    await ensureActorStatesLoaded(nuxtApp)

    pinia.use(
      createPersistedStatePlugin({
        persist: false,
        storage: {
          getItem: async (piniaKey) => {
            const remote = await ensureActorStatesLoaded(nuxtApp)
            const mappedKey = mapStoreKey(piniaKey)

            if (Object.prototype.hasOwnProperty.call(remote, mappedKey)) {
              return JSON.stringify(remote[mappedKey])
            }

            const value = await get<string>(piniaKey)
            return value ?? null
          },
          setItem: async (piniaKey, piniaValue) => {
            const previousPiniaValue = (await get<string>(piniaKey)) ?? null
            await set(piniaKey, piniaValue)

            const atprotoTargetRecord = parseAtprotoStoreKey(piniaKey)
            if (!atprotoTargetRecord) {
              return piniaValue
            }

            const { isLogged } = nuxtApp.runWithContext(() => useAtprotoSession())
            if (!isLogged.value) {
              return piniaValue
            }

            const { collection, rkey } = atprotoTargetRecord

            try {
              const currentObj = JSON.parse(piniaValue)
              const previousObj = previousPiniaValue
                ? JSON.parse(previousPiniaValue)
                : null
              if (previousObj && deepEqual(currentObj, previousObj)) {
                return piniaValue
              }
            } catch {
              if (piniaValue === previousPiniaValue) {
                return piniaValue
              }
            }

            const agent = nuxtApp.runWithContext(() => useAtprotoAgent('authenticated'))

            return putAtprotoApplicationState(
              agent,
              agent.assertDid,
              collection,
              rkey,
              JSON.parse(piniaValue),
            ).then(() => {
              return piniaValue
            }).catch(() => {
              return piniaValue
            })
          },
          removeItem: async (key) => {
            await del(key)
          },
        },
      }),
    )
  },
})
