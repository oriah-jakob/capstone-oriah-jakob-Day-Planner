import { readdirSync, statSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

import { loadEnv, type Plugin } from 'vite'

/**
 * Serve the api/ directory locally.
 *
 * In production Vercel turns each file under api/ into a serverless function.
 * Nothing does that during `vite dev` or `vite preview`, so without this plugin
 * the auth endpoints would only exist once deployed — and the end-to-end tests,
 * which run against the preview server, could never sign anybody in.
 *
 * Handlers are plain Node (req, res) functions and are imported directly:
 * Node strips the TypeScript itself, which is why every import inside api/ is
 * relative and carries an explicit .ts extension.
 */

const API_DIR = 'api'
const ROUTE_PREFIX = '/api'

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void

/** Map "/api/auth/login" to the absolute path of api/auth/login.ts. */
function collectRoutes(root: string): Map<string, string> {
  const routes = new Map<string, string>()
  const base = join(root, API_DIR)

  const walk = (dir: string) => {
    let entries: string[]
    try {
      entries = readdirSync(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      const full = join(dir, entry)

      if (statSync(full).isDirectory()) {
        // Underscore-prefixed directories are shared code, not routes. Vercel
        // applies the same convention.
        if (!entry.startsWith('_')) walk(full)
        continue
      }

      if (!entry.endsWith('.ts') || entry.startsWith('_')) continue

      const route = `${ROUTE_PREFIX}/${relative(base, full).split(sep).join('/')}`.replace(
        /\.ts$/,
        '',
      )
      routes.set(route, full)
    }
  }

  walk(base)
  return routes
}

function createMiddleware(root: string, bustCache: boolean) {
  const handle = async (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: unknown) => void,
  ) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname

    if (!pathname.startsWith(`${ROUTE_PREFIX}/`)) {
      next()
      return
    }

    // Re-scanned per request so a newly added endpoint is picked up without a
    // restart during development.
    const file = collectRoutes(root).get(pathname)

    if (!file) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ error: 'Not found.' }))
      return
    }

    try {
      // The query suffix defeats the module cache so edits take effect without
      // restarting the dev server.
      const specifier = pathToFileURL(file).href + (bustCache ? `?t=${Date.now()}` : '')
      const module = (await import(specifier)) as { default?: Handler }

      if (typeof module.default !== 'function') {
        throw new Error(`${file} does not default-export a handler`)
      }

      await module.default(req, res)
    } catch (error) {
      console.error(`[api] ${pathname} failed to execute:`, error)
      if (!res.headersSent) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }))
      }
    }
  }

  // Connect middlewares are synchronous. `handle` already contains its own
  // try/catch, so nothing can escape the floating promise.
  return (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void): void => {
    void handle(req, res, next)
  }
}

export function apiRoutes(): Plugin {
  let root = process.cwd()

  return {
    name: 'remmi:api-routes',

    configResolved(config) {
      root = config.root

      // Vite only exposes VITE_-prefixed variables to the client. The handlers
      // run in Node and need the unprefixed ones (service role key, app URL),
      // so load the full .env set into process.env. Existing values win, which
      // keeps CI and shell overrides authoritative.
      const env = loadEnv(config.mode, root, '')
      for (const [key, value] of Object.entries(env)) {
        process.env[key] ??= value
      }
    },

    // Added directly rather than in the returned callback so these run before
    // Vite's static handling and SPA fallback claim the URL.
    configureServer(server) {
      server.middlewares.use(createMiddleware(root, true))
    },

    configurePreviewServer(server) {
      server.middlewares.use(createMiddleware(root, false))
    },
  }
}
