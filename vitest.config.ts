import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'client',
            environment: 'jsdom',
            include: ['client/**/*.test.{ts,tsx}'],
          },
        },
        {
          test: {
            name: 'server',
            environment: 'node',
            include: ['server/**/*.test.ts'],
          },
        },
      ],
    },
  }),
)
