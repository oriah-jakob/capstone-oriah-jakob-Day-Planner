import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { apiRoutes } from './plugins/api-routes.ts'

type VercelConfig = { headers: { source: string; headers: { key: string; value: string }[] }[] }

const vercel = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as VercelConfig

// Preview sends the production headers so the smoke specs check the same thing locally.
const productionHeaders = Object.fromEntries(
  (vercel.headers.find((rule) => rule.source === '/(.*)')?.headers ?? []).map(({ key, value }) => [
    key,
    value,
  ]),
)

export default defineConfig({
  plugins: [react(), tailwindcss(), apiRoutes()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
    headers: productionHeaders,
  },
})
