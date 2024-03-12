import {coverageConfigDefaults, defineConfig} from 'vitest/config'

export default defineConfig({          test: {
    environmentMatchGlobs: [
      ['**/__tests__/**/*.browser.test.{ts,tsx}', 'happy-dom'],
    ],
    globals: true,
    typecheck: {
      enabled: true,
    },
  }})
