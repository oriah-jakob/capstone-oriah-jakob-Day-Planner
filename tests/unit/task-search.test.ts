import { describe, expect, it } from 'vitest'

import {
  hasFilters,
  NO_FILTERS,
  parseFilters,
  searchFilter,
  toSearchParams,
} from '@/features/tasks/search'

const B = '\\'

describe('searchFilter (FR-21.1)', () => {
  it('searches title and note, case-insensitively', () => {
    expect(searchFilter('Gym')).toBe('title.ilike."*Gym*",note.ilike."*Gym*"')
  })

  it.each(['', '   '])('returns null for %j', (query) => {
    expect(searchFilter(query)).toBeNull()
  })

  it('trims the text', () => {
    expect(searchFilter('  Ch 5 ')).toBe('title.ilike."*Ch 5*",note.ilike."*Ch 5*"')
  })

  it('keeps commas and parentheses inside the quoted value', () => {
    expect(searchFilter('Fix (urgent), now')).toContain('"*Fix (urgent), now*"')
  })

  it('escapes double quotes', () => {
    expect(searchFilter('Say "hi"')).toContain(`"*Say ${B}"hi${B}"*"`)
  })

  it.each([
    ['50%', `50${B}${B}%`],
    ['snake_case', `snake${B}${B}_case`],
    [B, `${B}${B}${B}${B}`],
  ])('makes the LIKE wildcard in %j match literally', (query, escaped) => {
    expect(searchFilter(query)).toContain(`"*${escaped}*"`)
  })
})

describe('parseFilters', () => {
  it('reads every filter from the URL', () => {
    const params = new URLSearchParams('q=gym&date=2026-09-16&status=completed&type=3&sort=title')
    expect(parseFilters(params)).toEqual({
      query: 'gym',
      date: '2026-09-16',
      status: 'completed',
      typeId: 3,
      sort: 'title',
    })
  })

  it('falls back to no filters for an empty URL', () => {
    expect(parseFilters(new URLSearchParams())).toEqual(NO_FILTERS)
  })

  it('drops malformed values instead of failing', () => {
    const params = new URLSearchParams('date=2026-02-30&status=done&type=abc&sort=random')
    expect(parseFilters(params)).toEqual(NO_FILTERS)
  })

  it.each(['0', '-2', '1.5'])('ignores type=%s', (type) => {
    expect(parseFilters(new URLSearchParams(`type=${type}`)).typeId).toBeNull()
  })
})

describe('toSearchParams and hasFilters', () => {
  it('writes only the filters that are set and leaves the default sort out', () => {
    expect(toSearchParams({ ...NO_FILTERS, query: 'gym', typeId: 2 })).toEqual({
      q: 'gym',
      type: '2',
    })
  })

  it('round-trips through the URL', () => {
    const filters = {
      query: 'ch 5',
      date: '2026-09-16',
      status: 'not_completed',
      typeId: 4,
      sort: 'status',
    } as const
    expect(parseFilters(new URLSearchParams(toSearchParams(filters)))).toEqual(filters)
  })

  it('knows when nothing is filtered', () => {
    expect(hasFilters(NO_FILTERS)).toBe(false)
    expect(hasFilters({ ...NO_FILTERS, sort: 'title' })).toBe(true)
  })
})
