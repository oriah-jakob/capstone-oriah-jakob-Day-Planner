import { expect, test, type APIRequestContext } from '@playwright/test'

import { headers, registerAccount, rest } from './utils'

/**
 * FR-16 to FR-19 asserted at the API layer: the browser hides controls, but these checks show the
 * database refuses the same actions when they are sent directly.
 */

type Account = Awaited<ReturnType<typeof registerAccount>>

const task = { task_type_id: 1, task_date: '2026-09-16', start_time: '07:00', end_time: '08:00' }

function call(request: APIRequestContext, account: Account | null, name: string, data: object) {
  return request.post(rest(`rpc/${name}`), {
    headers: headers(account?.session.accessToken),
    data,
  })
}

async function accountType(request: APIRequestContext, account: Account) {
  const read = await request.get(
    rest('profiles', `id=eq.${account.session.user.id}&select=account_type`),
    { headers: headers(account.session.accessToken) },
  )
  const [row] = (await read.json()) as { account_type: string }[]
  return row?.account_type
}

async function ownTasks(request: APIRequestContext, reader: Account, owner: Account) {
  const read = await request.get(
    rest('tasks', `owner_user_id=eq.${owner.session.user.id}&select=title&order=title`),
    { headers: headers(reader.session.accessToken) },
  )
  return (await read.json()) as { title: string }[]
}

async function family(request: APIRequestContext) {
  const owner = await registerAccount(request)
  const member = await registerAccount(request)
  const outsider = await registerAccount(request)
  expect(
    (await call(request, owner, 'create_family', { p_family_name: 'Jakob family' })).status(),
  ).toBe(200)
  expect(
    (await call(request, owner, 'add_family_member', { p_email: member.email })).status(),
  ).toBe(204)

  const created = await request.post(rest('tasks'), {
    headers: headers(owner.session.accessToken),
    data: [
      { ...task, title: 'Shared', hidden_from_family: false },
      { ...task, title: 'Private', hidden_from_family: true },
    ],
  })
  const rows = (await created.json()) as { id: string; title: string }[]
  return { owner, member, outsider, sharedId: rows.find((r) => r.title === 'Shared')!.id }
}

test.describe('creating a family (FR-16)', () => {
  test('makes the caller the owner and refuses a second family', async ({ request }) => {
    const owner = await registerAccount(request)

    const created = await call(request, owner, 'create_family', { p_family_name: 'Jakob family' })
    expect(created.status()).toBe(200)
    expect(await accountType(request, owner)).toBe('family_owner')

    const again = await call(request, owner, 'create_family', { p_family_name: 'Another' })
    expect(again.status()).toBe(400)
    expect(((await again.json()) as { message: string }).message).toBe(
      'You already belong to a family.',
    )
  })

  test('refuses a signed-out caller', async ({ request }) => {
    const response = await call(request, null, 'create_family', { p_family_name: 'Nobody' })
    expect(response.status()).toBe(401)
  })
})

test.describe('adding members (FR-17)', () => {
  test('links the account and updates its type', async ({ request }) => {
    const { member } = await family(request)
    expect(await accountType(request, member)).toBe('family_member')
  })

  test('answers an unknown email and a taken one identically (NFR-8.1)', async ({ request }) => {
    const { member } = await family(request)
    const owner = await registerAccount(request)
    await call(request, owner, 'create_family', { p_family_name: 'Other family' })

    const unknown = await call(request, owner, 'add_family_member', {
      p_email: 'nobody-registered@example.com',
    })
    const taken = await call(request, owner, 'add_family_member', { p_email: member.email })

    expect(unknown.status()).toBe(400)
    expect(taken.status()).toBe(unknown.status())
    expect(await taken.json()).toEqual(await unknown.json())
  })

  test('refuses anyone but the owner', async ({ request }) => {
    const { member, outsider } = await family(request)

    const response = await call(request, member, 'add_family_member', { p_email: outsider.email })
    expect(response.status()).toBe(403)
    expect(await accountType(request, outsider)).toBe('personal')
  })

  test('refuses writing the membership table directly', async ({ request }) => {
    const { owner, outsider } = await family(request)
    const families = await request.get(rest('families', 'select=id'), {
      headers: headers(owner.session.accessToken),
    })
    const [{ id }] = (await families.json()) as { id: string }[]

    const insert = await request.post(rest('family_members'), {
      headers: headers(owner.session.accessToken),
      data: { family_id: id, user_id: outsider.session.user.id, role: 'member' },
    })
    expect(insert.status()).toBe(403)
  })
})

test.describe('view-only timelines (FR-19)', () => {
  test('a member reads the shared tasks but not the hidden ones', async ({ request }) => {
    const { owner, member } = await family(request)

    expect(await ownTasks(request, member, owner)).toEqual([{ title: 'Shared' }])
    expect(await ownTasks(request, owner, owner)).toEqual([
      { title: 'Private' },
      { title: 'Shared' },
    ])
  })

  test('someone outside the family reads nothing', async ({ request }) => {
    const { owner, outsider } = await family(request)

    expect(await ownTasks(request, outsider, owner)).toEqual([])
    const profile = await request.get(
      rest('profiles', `id=eq.${owner.session.user.id}&select=first_name`),
      { headers: headers(outsider.session.accessToken) },
    )
    expect(await profile.json()).toEqual([])
  })

  test('a member cannot change, delete or add tasks on the owner timeline (FR-19.2)', async ({
    request,
  }) => {
    const { owner, member, sharedId } = await family(request)
    const asMember = headers(member.session.accessToken)
    const byId = rest('tasks', `id=eq.${sharedId}`)

    expect(
      await (await request.patch(byId, { headers: asMember, data: { title: 'Changed' } })).json(),
    ).toEqual([])
    expect(await (await request.delete(byId, { headers: asMember })).json()).toEqual([])
    const insert = await request.post(rest('tasks'), {
      headers: asMember,
      data: { ...task, title: 'Planted', owner_user_id: owner.session.user.id },
    })
    expect(insert.status()).toBe(403)

    expect(await ownTasks(request, owner, owner)).toEqual([
      { title: 'Private' },
      { title: 'Shared' },
    ])
  })
})

test.describe('removing members (FR-18)', () => {
  test('ends access and resets the account type', async ({ request }) => {
    const { owner, member } = await family(request)

    const removed = await call(request, owner, 'remove_family_member', {
      p_user_id: member.session.user.id,
    })
    expect(removed.status()).toBe(204)
    expect(await accountType(request, member)).toBe('personal')
    expect(await ownTasks(request, member, owner)).toEqual([])
  })

  test('refuses anyone but the owner, and the owner cannot remove themselves', async ({
    request,
  }) => {
    const { owner, member } = await family(request)

    const byMember = await call(request, member, 'remove_family_member', {
      p_user_id: owner.session.user.id,
    })
    expect(byMember.status()).toBe(403)

    const self = await call(request, owner, 'remove_family_member', {
      p_user_id: owner.session.user.id,
    })
    expect(self.status()).toBe(400)
    expect(await accountType(request, owner)).toBe('family_owner')
  })
})

test('anonymous requests reach no table (hosted default grants revoked)', async ({ request }) => {
  for (const table of ['profiles', 'tasks', 'task_types', 'families', 'family_members']) {
    const response = await request.get(rest(table, 'select=*'), { headers: headers() })
    expect(response.status(), table).toBe(401)
  }
})
