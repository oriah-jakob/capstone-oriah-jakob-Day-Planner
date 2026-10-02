import { expect, test } from '@playwright/test'

/**
 * Deployment smoke test. Read-only, so it is safe against production:
 * PLAYWRIGHT_BASE_URL=https://<app>.vercel.app npm run test:smoke
 */

test.describe('deployment smoke', () => {
  test('serves the app and sends a visitor to sign in', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/Remmi/)
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome back' })).toBeVisible()
    await expect(page).toHaveURL(/\/login$/)
  })

  test('serves deep links through the single page app fallback', async ({ request }) => {
    const response = await request.get('/settings')

    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
    expect(await response.text()).toContain('<div id="root">')
  })

  test('runs the auth functions', async ({ request }) => {
    const response = await request.post('/api/auth/refresh')

    expect(response.status()).toBe(401)
    expect(response.headers()['cache-control']).toBe('no-store')
    expect(await response.json()).toEqual({ error: 'Not signed in.' })
  })

  test('refuses the wrong method on an auth function', async ({ request }) => {
    const response = await request.get('/api/auth/login')
    expect(response.status()).toBe(405)
  })

  test('sends the security headers', async ({ request }) => {
    const headers = (await request.get('/')).headers()

    expect(headers['strict-transport-security']).toContain('max-age=')
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  })

  test('redirects plain http to https (NFR-5)', async ({ request, baseURL }) => {
    test.skip(!baseURL?.startsWith('https://'), 'Only meaningful against a deployed URL.')

    const response = await request.get(baseURL!.replace('https://', 'http://'), {
      maxRedirects: 0,
    })

    expect([301, 307, 308]).toContain(response.status())
    expect(response.headers()['location']).toMatch(/^https:\/\//)
  })
})
