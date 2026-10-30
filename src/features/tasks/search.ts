import { isIsoDate } from '@/lib/datetime'
import { COMPLETION_STATUSES, type CompletionStatus } from '@/lib/validation/task'

export const SORT_KEYS = ['date', 'title', 'type', 'status'] as const
export type SortKey = (typeof SORT_KEYS)[number]

export type TaskFilters = {
  query: string
  date: string | null
  status: CompletionStatus | null
  typeId: number | null
  sort: SortKey
}

export const NO_FILTERS: TaskFilters = {
  query: '',
  date: null,
  status: null,
  typeId: null,
  sort: 'date',
}

/** Reads filters from the URL, dropping anything malformed instead of failing the page. */
export function parseFilters(params: URLSearchParams): TaskFilters {
  const date = params.get('date')
  const status = params.get('status')
  const typeId = Number(params.get('type'))
  const sort = params.get('sort')

  return {
    query: params.get('q')?.trim() ?? '',
    date: date && isIsoDate(date) ? date : null,
    status: COMPLETION_STATUSES.find((s) => s === status) ?? null,
    typeId: Number.isInteger(typeId) && typeId > 0 ? typeId : null,
    sort: SORT_KEYS.find((key) => key === sort) ?? 'date',
  }
}

export function toSearchParams(filters: TaskFilters): Record<string, string> {
  const params: Record<string, string> = {}
  if (filters.query.trim() !== '') params.q = filters.query
  if (filters.date) params.date = filters.date
  if (filters.status) params.status = filters.status
  if (filters.typeId) params.type = String(filters.typeId)
  if (filters.sort !== 'date') params.sort = filters.sort
  return params
}

export function hasFilters(filters: TaskFilters): boolean {
  return Object.keys(toSearchParams(filters)).length > 0
}

/**
 * PostgREST `or` filter for FR-21: title or note contains the text.
 * LIKE wildcards are escaped so they match literally, then the value is quoted because
 * commas and parentheses are part of the `or` syntax.
 */
export function searchFilter(query: string): string | null {
  const text = query.trim()
  if (text === '') return null

  const literal = text.replace(/[\\%_]/g, (char) => `\\${char}`)
  const quoted = `"*${literal.replace(/[\\"]/g, (char) => `\\${char}`)}*"`
  return `title.ilike.${quoted},note.ilike.${quoted}`
}
