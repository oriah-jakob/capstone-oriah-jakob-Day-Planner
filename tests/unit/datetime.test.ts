import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  addDays,
  formatDayHeading,
  formatTime,
  isIsoDate,
  partOfDay,
  toIsoDate,
  todayIsoDate,
} from '@/lib/datetime'

const originalTz = process.env.TZ

// The risk register calls out DST drift, so pin a zone that has it.
beforeAll(() => {
  process.env.TZ = 'America/Toronto'
})

afterAll(() => {
  process.env.TZ = originalTz
})

describe('toIsoDate', () => {
  it('pads the month and day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('uses the local date, not UTC', () => {
    expect(toIsoDate(new Date(2026, 8, 16, 23, 30))).toBe('2026-09-16')
  })

  it('gives today for the supplied clock', () => {
    expect(todayIsoDate(new Date(2026, 11, 31, 8))).toBe('2026-12-31')
  })
})

describe('isIsoDate', () => {
  it.each(['2026-09-16', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each(['', '2026-9-16', '2026-02-30', '2027-02-29', '2026-13-01', 'tomorrow'])(
    'rejects %j',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    },
  )
})

describe('addDays', () => {
  it.each([
    ['2026-09-16', 1, '2026-09-17'],
    ['2026-09-16', -1, '2026-09-15'],
    ['2026-09-30', 1, '2026-10-01'],
    ['2026-12-31', 1, '2027-01-01'],
    ['2027-01-01', -1, '2026-12-31'],
    ['2028-02-28', 1, '2028-02-29'],
    ['2026-09-16', 7, '2026-09-23'],
  ])('%s %+i day(s) is %s', (iso, days, expected) => {
    expect(addDays(iso, days)).toBe(expected)
  })

  it.each([
    ['2026-03-07', '2026-03-08', '2026-03-09'],
    ['2026-10-31', '2026-11-01', '2026-11-02'],
  ])('steps across a daylight saving change (%s, %s, %s)', (before, change, after) => {
    expect(addDays(before, 1)).toBe(change)
    expect(addDays(change, 1)).toBe(after)
    expect(addDays(after, -1)).toBe(change)
    expect(addDays(change, -1)).toBe(before)
  })
})

describe('formatDayHeading', () => {
  it('names the weekday and date within the current year', () => {
    expect(formatDayHeading('2026-09-16', '2026-09-20')).toBe('Wednesday, September 16')
  })

  it('adds the year for another year', () => {
    expect(formatDayHeading('2027-01-01', '2026-12-31')).toBe('Friday, January 1, 2027')
  })
})

describe('formatTime', () => {
  it.each([
    ['00:00:00', '12:00 AM'],
    ['07:05', '7:05 AM'],
    ['11:59:00', '11:59 AM'],
    ['12:00', '12:00 PM'],
    ['18:45:00', '6:45 PM'],
    ['23:59', '11:59 PM'],
  ])('formats %s as %s', (time, expected) => {
    expect(formatTime(time)).toBe(expected)
  })

  it('returns anything unrecognised unchanged', () => {
    expect(formatTime('noon')).toBe('noon')
  })
})

describe('partOfDay', () => {
  it.each([
    [4, 'evening'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [17, 'afternoon'],
    [18, 'evening'],
    [23, 'evening'],
  ])('hour %i is %s', (hour, expected) => {
    expect(partOfDay(new Date(2026, 8, 16, hour, 30))).toBe(expected)
  })
})
