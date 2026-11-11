import { GENERIC_ERROR_MESSAGE } from '@/lib/errors'

type Orderable = { role: string; profiles: { first_name: string; last_name: string } }

/** Owner first, then everyone else by name. */
export function orderMembers<T extends Orderable>(members: readonly T[]): T[] {
  const name = (m: Orderable) => `${m.profiles.first_name} ${m.profiles.last_name}`
  return [...members].sort(
    (a, b) =>
      Number(b.role === 'owner') - Number(a.role === 'owner') ||
      name(a).localeCompare(name(b), undefined, { sensitivity: 'base' }),
  )
}

/**
 * P0001 messages are written by hand in the family functions, so they are safe to show;
 * anything else stays generic (NFR-8).
 */
export function familyErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code, message } = error as { code: unknown; message?: unknown }
    if (code === 'P0001' && typeof message === 'string') return message
    if (code === '42501') return 'Only the family owner can do that.'
  }
  return GENERIC_ERROR_MESSAGE
}
