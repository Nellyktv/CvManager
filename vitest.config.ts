import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'client',
            include: ['client/**/*.test.{ts,tsx}'],
            environment: 'jsdom',
            setupFiles: ['client/test/setup.ts'],
          },
        },
        {
          test: {
            name: 'server',
            include: ['server/**/*.test.js'],
            environment: 'node',
          },
        },
      ],
    },
  }),
)
