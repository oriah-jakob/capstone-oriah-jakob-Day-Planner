const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME = /^(\d{2}):(\d{2})(?::\d{2})?$/

const pad = (value: number) => String(value).padStart(2, '0')

/** Local calendar date as YYYY-MM-DD; toISOString would shift it to UTC. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function todayIsoDate(now: Date = new Date()): string {
  return toIsoDate(now)
}

export function isIsoDate(value: string): boolean {
  const match = ISO_DATE.exec(value)
  if (!match) return false
  const [, year, month, day] = match.map(Number) as [number, number, number, number]
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

/** Noon, so a daylight saving shift can never push the date across midnight. */
function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number]
  return new Date(year, month - 1, day, 12)
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function formatDayHeading(iso: string, today: string = todayIsoDate()): string {
  const sameYear = iso.slice(0, 4) === today.slice(0, 4)
  return new Intl.DateTimeFormat('en-CA', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(parseIsoDate(iso))
}

/** "17:30:00" or "17:30" to "5:30 PM". */
export function formatTime(time: string): string {
  const match = TIME.exec(time)
  if (!match) return time
  const hours = Number(match[1])
  const suffix = hours < 12 ? 'AM' : 'PM'
  return `${hours % 12 || 12}:${match[2]} ${suffix}`
}

export function partOfDay(now: Date = new Date()): 'morning' | 'afternoon' | 'evening' {
  const hour = now.getHours()
  if (hour >= 5 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}
