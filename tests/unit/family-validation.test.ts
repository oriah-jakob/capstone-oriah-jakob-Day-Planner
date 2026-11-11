import { describe, expect, it } from 'vitest'

import {
  addMemberSchema,
  createFamilySchema,
  FAMILY_NAME_MAX_LENGTH,
} from '@/lib/validation/family'

function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? null : (result.error?.issues[0]?.message ?? null)
}

describe('createFamilySchema (FR-16)', () => {
  it('accepts and trims a family name', () => {
    const result = createFamilySchema.safeParse({ familyName: '  Jakob family ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.familyName).toBe('Jakob family')
  })

  it('requires a name', () => {
    expect(firstError(createFamilySchema.safeParse({ familyName: '   ' }))).toBe(
      'Family name is required.',
    )
  })

  it('accepts exactly the maximum length and rejects one more', () => {
    const max = 'a'.repeat(FAMILY_NAME_MAX_LENGTH)
    expect(createFamilySchema.safeParse({ familyName: max }).success).toBe(true)
    expect(firstError(createFamilySchema.safeParse({ familyName: `${max}a` }))).toBe(
      `Family name must be ${FAMILY_NAME_MAX_LENGTH} characters or fewer.`,
    )
  })
})

describe('addMemberSchema (FR-17)', () => {
  it('normalises the email address', () => {
    const result = addMemberSchema.safeParse({ email: '  Ben@Example.COM ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.email).toBe('ben@example.com')
  })

  it.each([
    ['', 'Email address is required.'],
    ['not-an-email', 'Enter a valid email address.'],
  ])('rejects %j', (email, message) => {
    expect(firstError(addMemberSchema.safeParse({ email }))).toBe(message)
  })
})
