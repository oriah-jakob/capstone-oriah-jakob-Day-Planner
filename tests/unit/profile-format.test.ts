import { describe, expect, it } from 'vitest'

import { accountTypeLabel, formatLeadTime, initials } from '@/features/profile/format'

describe('accountTypeLabel (FR-8.6)', () => {
  it.each([
    ['personal', 'Personal account'],
    ['family_owner', 'Family owner'],
    ['family_member', 'Family member'],
  ])('labels %s', (type, label) => {
    expect(accountTypeLabel(type)).toBe(label)
  })

  it('falls back to personal for an unknown value', () => {
    expect(accountTypeLabel('something_else')).toBe('Personal account')
  })
})

describe('formatLeadTime', () => {
  it.each([
    [0, 'At task start'],
    [1, '1 minute before task start'],
    [15, '15 minutes before task start'],
    [1440, '1440 minutes before task start'],
  ])('formats %i minutes', (minutes, text) => {
    expect(formatLeadTime(minutes)).toBe(text)
  })
})

describe('initials', () => {
  it('takes the first letter of each name, uppercased', () => {
    expect(initials('nick', 'lawson')).toBe('NL')
  })

  it('copes with an empty name', () => {
    expect(initials('Ori', '')).toBe('O')
  })
})
