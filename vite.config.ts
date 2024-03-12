import dts from 'vite-plugin-dts'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    dts({
      entryRoot: 'src',
      staticImport: true,
      pathsToAliases: false,
      exclude: [
        '**/__tests__/**/*',
        '**/__stories__/**/*',
        '**/*.stories.(tsx|ts|js|jsx)',
        '**/*.test.(tsx|ts|js|jsx)',
        '**/*.test-d.(tsx|ts|js|jsx)',
        '**/*.spec.(tsx|ts|js|jsx)',
        'vite.config.ts',
      ],
      include: ['**/src/**/*.ts', '**/src/**/*.tsx'],
      copyDtsFiles: true,
    }),
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: 'src/index.ts',
        ['client/index']: 'src/client/index.ts',
      },
    },
    rollupOptions: {
      external: (source) => {
        return !(source.includes('src') || source.startsWith('.'))
      },
    },
  },
  test: {
    environmentMatchGlobs: [
      ['**/__tests__/**/*.browser.test.{ts,tsx}', 'happy-dom'],
    ],
    globals: true,
    typecheck: {
      enabled: true,
    },
  },
})
