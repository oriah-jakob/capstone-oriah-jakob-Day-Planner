import { describe, expect, it } from 'vitest'

import { familyErrorMessage, orderMembers } from '@/features/family/members'
import { GENERIC_ERROR_MESSAGE } from '@/lib/errors'

const member = (first_name: string, role = 'member') => ({
  role,
  profiles: { first_name, last_name: 'Jakob' },
})

describe('orderMembers', () => {
  it('lists the owner first, then members by name', () => {
    const ordered = orderMembers([
      member('zoe'),
      member('Ben'),
      member('Ori', 'owner'),
      member('ada'),
    ])
    expect(ordered.map((m) => m.profiles.first_name)).toEqual(['Ori', 'ada', 'Ben', 'zoe'])
  })

  it('does not mutate the input', () => {
    const members = [member('Ben'), member('Ori', 'owner')]
    orderMembers(members)
    expect(members[0]?.profiles.first_name).toBe('Ben')
  })
})

describe('familyErrorMessage (NFR-8)', () => {
  it('passes through the messages written in the family functions', () => {
    expect(familyErrorMessage({ code: 'P0001', message: 'You already belong to a family.' })).toBe(
      'You already belong to a family.',
    )
  })

  it('explains a permission error without detail', () => {
    expect(
      familyErrorMessage({
        code: '42501',
        message: 'permission denied for function add_family_member',
      }),
    ).toBe('Only the family owner can do that.')
  })

  it.each([
    { code: '23514', message: 'new row violates check constraint "families_family_name_check"' },
    { code: 'P0001' },
    new Error('Failed to fetch'),
    null,
    'oops',
  ])('falls back to the generic message for %j', (error) => {
    expect(familyErrorMessage(error)).toBe(GENERIC_ERROR_MESSAGE)
  })
})
