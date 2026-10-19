import { existsSync } from 'node:fs'

import { defineConfig, devices } from '@playwright/test'

// Playwright does not read .env files; the API specs need the Supabase URL and key.
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const PORT = 4173
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  // Unit tests are *.test.ts and belong to Vitest.
  testMatch: '**/*.spec.ts',
  fullyParallel: true,

  // A committed `test.only` should fail the pipeline, not silently skip the suite.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['github']]
    : [['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Tests run against the production build, not the dev server, so what CI
  // exercises matches what Vercel serves.
  // A deployed target is already running; only start the preview server for local runs.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run preview -- --port ${PORT}`,
        url: BASE_URL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
