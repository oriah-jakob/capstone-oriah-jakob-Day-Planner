import { expect, test, type APIRequestContext } from '@playwright/test'

import { headers, registerAccount, rest } from './utils'

/** API-03: create a task through Supabase PostgREST, where the table checks and RLS are the guard. */

const task = {
  task_type_id: 1,
  title: 'Gym',
  task_date: '2026-09-16',
  start_time: '07:00',
  end_time: '08:00',
}

const ownTasks = (query = 'select=title') => rest('tasks', query)

test.describe('API-03 create task', () => {
  test('stores the task on the caller timeline with the defaults', async ({ request }) => {
    const { session } = await registerAccount(request)

    const response = await request.post(rest('tasks'), {
      headers: headers(session.accessToken),
      data: task,
    })
    expect(response.status()).toBe(201)

    const [row] = (await response.json()) as Record<string, unknown>[]
    expect(row).toMatchObject({
      ...task,
      start_time: '07:00:00',
      end_time: '08:00:00',
      owner_user_id: session.user.id,
      completion_status: 'not_completed',
      note: null,
    })

    const read = await request.get(
      ownTasks(`select=title,start_time&task_date=eq.${task.task_date}`),
      { headers: headers(session.accessToken) },
    )
    expect(await read.json()).toEqual([{ title: 'Gym', start_time: '07:00:00' }])
  })

  test.describe('rejects an invalid payload and stores nothing', () => {
    const attempts = [
      [
        'an end time before the start time (F4-03)',
        { start_time: '09:00', end_time: '08:00' },
        400,
      ],
      ['an end time equal to the start time', { end_time: '07:00' }, 400],
      ['an empty title', { title: '' }, 400],
      ['a title with surrounding spaces', { title: ' Gym ' }, 400],
      ['a title over 120 characters', { title: 'a'.repeat(121) }, 400],
      ['an empty note', { note: '' }, 400],
      ['an unknown completion status', { completion_status: 'done' }, 400],
      ['an unknown task type', { task_type_id: 999 }, 409],
    ] as const

    for (const [label, override, status] of attempts) {
      test(label, async ({ request }) => {
        const { session } = await registerAccount(request)

        const response = await request.post(rest('tasks'), {
          headers: headers(session.accessToken),
          data: { ...task, ...override },
        })
        expect(response.status()).toBe(status)

        const read = await request.get(ownTasks(), { headers: headers(session.accessToken) })
        expect(await read.json()).toEqual([])
      })
    }
  })

  test('cannot create a task on another user timeline (FR-19.2)', async ({ request }) => {
    const owner = await registerAccount(request)
    const other = await registerAccount(request)

    const response = await request.post(rest('tasks'), {
      headers: headers(other.session.accessToken),
      data: { ...task, owner_user_id: owner.session.user.id },
    })
    expect(response.status()).toBe(403)

    const read = await request.get(ownTasks(), { headers: headers(owner.session.accessToken) })
    expect(await read.json()).toEqual([])
  })

  test('rejects a request without a session', async ({ request }) => {
    const response = await request.post(rest('tasks'), { headers: headers(), data: task })
    expect(response.status()).toBe(401)
  })

  test('another user cannot read the task (row level security)', async ({ request }) => {
    const owner = await registerAccount(request)
    const other = await registerAccount(request)

    await request.post(rest('tasks'), { headers: headers(owner.session.accessToken), data: task })

    const read = await request.get(ownTasks(), { headers: headers(other.session.accessToken) })
    expect(await read.json()).toEqual([])
  })

  test('lists the seeded task types for a signed-in user only', async ({ request }) => {
    const { session } = await registerAccount(request)

    const read = await request.get(rest('task_types', 'select=type_name&order=id'), {
      headers: headers(session.accessToken),
    })
    expect(await read.json()).toEqual(
      ['Work', 'Health', 'Study', 'Errand', 'Chore', 'Personal', 'Routine'].map((type_name) => ({
        type_name,
      })),
    )

    const anonymous = await request.get(rest('task_types', 'select=type_name'), {
      headers: headers(),
    })
    expect(anonymous.status()).toBe(401)
  })
})

test.describe('task updates and deletes (FR-13 to FR-15)', () => {
  async function ownedTask(request: APIRequestContext) {
    const account = await registerAccount(request)
    const created = await request.post(rest('tasks'), {
      headers: headers(account.session.accessToken),
      data: task,
    })
    const [row] = (await created.json()) as { id: string }[]
    return { ...account, taskId: row.id }
  }

  const byId = (id: string, select = 'title,start_time,completion_status') =>
    rest('tasks', `id=eq.${id}&select=${select}`)

  test('the owner can edit a task and the change is stored', async ({ request }) => {
    const { session, taskId } = await ownedTask(request)

    const update = await request.patch(byId(taskId), {
      headers: headers(session.accessToken),
      data: { title: 'Evening gym', start_time: '18:00', end_time: '19:00' },
    })
    expect(update.status()).toBe(200)

    const read = await request.get(byId(taskId), { headers: headers(session.accessToken) })
    expect(await read.json()).toEqual([
      { title: 'Evening gym', start_time: '18:00:00', completion_status: 'not_completed' },
    ])
  })

  test('an edit that breaks the time rule is refused and nothing changes', async ({ request }) => {
    const { session, taskId } = await ownedTask(request)

    const update = await request.patch(byId(taskId), {
      headers: headers(session.accessToken),
      data: { end_time: '06:00' },
    })
    expect(update.status()).toBe(400)

    const read = await request.get(byId(taskId, 'end_time'), {
      headers: headers(session.accessToken),
    })
    expect(await read.json()).toEqual([{ end_time: '08:00:00' }])
  })

  test('the owner can mark a task completed (FR-15.1)', async ({ request }) => {
    const { session, taskId } = await ownedTask(request)

    await request.patch(byId(taskId), {
      headers: headers(session.accessToken),
      data: { completion_status: 'completed' },
    })

    const read = await request.get(byId(taskId, 'completion_status'), {
      headers: headers(session.accessToken),
    })
    expect(await read.json()).toEqual([{ completion_status: 'completed' }])
  })

  test('the owner can delete a task', async ({ request }) => {
    const { session, taskId } = await ownedTask(request)

    const removed = await request.delete(byId(taskId, 'id'), {
      headers: headers(session.accessToken),
    })
    expect(removed.status()).toBe(200)
    expect(await removed.json()).toEqual([{ id: taskId }])

    const read = await request.get(byId(taskId), { headers: headers(session.accessToken) })
    expect(await read.json()).toEqual([])
  })

  test('another user cannot edit or delete the task', async ({ request }) => {
    const owner = await ownedTask(request)
    const other = await registerAccount(request)

    const update = await request.patch(byId(owner.taskId), {
      headers: headers(other.session.accessToken),
      data: { title: 'Hijacked' },
    })
    expect(await update.json()).toEqual([])

    const removed = await request.delete(byId(owner.taskId, 'id'), {
      headers: headers(other.session.accessToken),
    })
    expect(await removed.json()).toEqual([])

    const read = await request.get(byId(owner.taskId, 'title'), {
      headers: headers(owner.session.accessToken),
    })
    expect(await read.json()).toEqual([{ title: 'Gym' }])
  })
})
