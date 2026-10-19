import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { headers, PASSWORD, registerAccount, rest } from './utils'

/**
 * API-01 and API-02 from the proposal's API test plan, asserted at the HTTP layer:
 * the /api/auth endpoints for accounts and Supabase PostgREST for the profile row.
 */

const profiles = (query: string) => rest('profiles', query)

test.describe('API-01 create account', () => {
  test('creates the account and returns a session for it', async ({ request }) => {
    const { email, session } = await registerAccount(request)

    expect(session.accessToken).toEqual(expect.any(String))
    expect(session.user).toMatchObject({ email, firstName: 'Api', lastName: 'Tester' })
  })

  test('stores the refresh token in an HttpOnly, Secure, SameSite cookie (NFR-3)', async ({
    request,
  }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        firstName: 'Api',
        lastName: 'Tester',
        email: `api-${randomUUID()}@example.com`,
        password: PASSWORD,
      },
    })

    const cookie = response
      .headersArray()
      .find((header) => header.name.toLowerCase() === 'set-cookie')?.value
    expect(cookie).toContain('remmi_rt=')
    expect(cookie).toContain('HttpOnly')
    expect(cookie).toContain('Secure')
    expect(cookie).toContain('SameSite=Lax')
    expect(cookie).toContain('Path=/api/auth')
  })

  test('refuses a duplicate email address (FR-1.2)', async ({ request }) => {
    const { email } = await registerAccount(request)

    const response = await request.post('/api/auth/register', {
      data: { firstName: 'Someone', lastName: 'Else', email, password: PASSWORD },
    })

    expect(response.status()).toBe(409)
    expect(((await response.json()) as { error: string }).error).toContain('already exists')
  })

  test('refuses a weak password (FR-1.3)', async ({ request }) => {
    const response = await request.post('/api/auth/register', {
      data: {
        firstName: 'Api',
        lastName: 'Tester',
        email: `api-${randomUUID()}@example.com`,
        password: 'weak',
      },
    })

    expect(response.status()).toBe(400)
    const body = (await response.json()) as { fieldErrors: Record<string, string> }
    expect(body.fieldErrors.password).toBeDefined()
  })
})

test.describe('API-02 update profile', () => {
  test('updates the profile and reads it back from the database', async ({ request }) => {
    const { session } = await registerAccount(request)
    const patch = { first_name: 'Updated', last_name: 'Name', notification_timer_minutes: 30 }

    const update = await request.patch(profiles(`id=eq.${session.user.id}`), {
      headers: headers(session.accessToken),
      data: patch,
    })
    expect(update.status()).toBe(200)
    expect(await update.json()).toEqual([expect.objectContaining(patch)])

    const read = await request.get(
      profiles(`id=eq.${session.user.id}&select=first_name,last_name,notification_timer_minutes`),
      { headers: headers(session.accessToken) },
    )
    expect(read.status()).toBe(200)
    expect(await read.json()).toEqual([patch])
  })

  test.describe('rejected updates leave the row unchanged', () => {
    const attempts = [
      ['the email address', { email: 'someone-else@example.com' }],
      ['the account type', { account_type: 'family_owner' }],
      ['a timer outside 0 to 1440', { notification_timer_minutes: 5000 }],
    ] as const

    for (const [label, body] of attempts) {
      test(`rejects changing ${label}`, async ({ request }) => {
        const { email, session } = await registerAccount(request)

        const update = await request.patch(profiles(`id=eq.${session.user.id}`), {
          headers: headers(session.accessToken),
          data: body,
        })
        expect(update.status()).toBe(400)

        const read = await request.get(
          profiles(`id=eq.${session.user.id}&select=email,account_type,notification_timer_minutes`),
          { headers: headers(session.accessToken) },
        )
        expect(await read.json()).toEqual([
          { email, account_type: 'personal', notification_timer_minutes: 15 },
        ])
      })
    }
  })

  test('rejects an update without a session', async ({ request }) => {
    const { session } = await registerAccount(request)

    const update = await request.patch(profiles(`id=eq.${session.user.id}`), {
      headers: headers(),
      data: { first_name: 'Anonymous' },
    })

    expect(update.status()).toBe(401)
  })

  test('cannot read or change another user profile (row level security)', async ({ request }) => {
    const owner = await registerAccount(request)
    const other = await registerAccount(request)

    const update = await request.patch(profiles(`id=eq.${owner.session.user.id}`), {
      headers: headers(other.session.accessToken),
      data: { first_name: 'Hijacked' },
    })
    expect(update.status()).toBe(200)
    expect(await update.json()).toEqual([])

    const read = await request.get(profiles(`id=eq.${owner.session.user.id}&select=first_name`), {
      headers: headers(other.session.accessToken),
    })
    expect(await read.json()).toEqual([])

    const ownerRead = await request.get(
      profiles(`id=eq.${owner.session.user.id}&select=first_name`),
      { headers: headers(owner.session.accessToken) },
    )
    expect(await ownerRead.json()).toEqual([{ first_name: 'Api' }])
  })
})
