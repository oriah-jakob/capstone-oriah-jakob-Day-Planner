import { ApiError } from '@/lib/api-client'

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again.'

/** NFR-8: only messages written by hand on the server reach the user. */
export function toUserMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : GENERIC_ERROR_MESSAGE
}
