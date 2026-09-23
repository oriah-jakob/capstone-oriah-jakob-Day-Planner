import { describe, expect, it } from 'vitest'

import {
  emailSchema,
  loginSchema,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth'

/** First error message for a failed parse, or null when the value was accepted. */
function firstError(result: { success: boolean; error?: { issues: { message: string }[] } }) {
  return result.success ? null : (result.error?.issues[0]?.message ?? null)
}

describe('emailSchema', () => {
  it.each(['user@example.com', 'first.last+tag@sub.example.co.uk', 'x@y.io'])(
    'accepts %s',
    (email) => {
      expect(emailSchema.safeParse(email).success).toBe(true)
    },
  )

  it.each([
    ['', 'Email address is required.'],
    ['   ', 'Email address is required.'],
    ['not-an-email', 'Enter a valid email address.'],
    ['missing@tld', 'Enter a valid email address.'],
    ['@example.com', 'Enter a valid email address.'],
  ])('rejects %j', (email, message) => {
    expect(firstError(emailSchema.safeParse(email))).toBe(message)
  })

  it('lowercases and trims so uniqueness is case insensitive', () => {
    expect(emailSchema.parse('  Ori.Jakob@Example.COM  ')).toBe('ori.jakob@example.com')
  })

  it('rejects an address longer than 254 characters', () => {
    const long = `${'a'.repeat(250)}@example.com`
    expect(emailSchema.safeParse(long).success).toBe(false)
  })
})

describe('passwordSchema (FR-1.3)', () => {
  it('accepts a password meeting every rule', () => {
    expect(passwordSchema.safeParse('Str0ng!Pass').success).toBe(true)
  })

  it.each([
    ['Ab1!def', 'too short', `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`],
    ['lowercase1!', 'no uppercase', 'Password must include an uppercase letter.'],
    ['UPPERCASE1!', 'no lowercase', 'Password must include a lowercase letter.'],
    ['NoDigitsHere!', 'no number', 'Password must include a number.'],
    ['NoSpecial123', 'no special character', 'Password must include a special character.'],
  ])('rejects %j (%s)', (password, _reason, message) => {
    expect(firstError(passwordSchema.safeParse(password))).toBe(message)
  })

  it('accepts exactly the minimum length', () => {
    const password = 'Aa1!bcde'
    expect(password).toHaveLength(PASSWORD_MIN_LENGTH)
    expect(passwordSchema.safeParse(password).success).toBe(true)
  })

  it('rejects longer than bcrypt considers, rather than silently truncating', () => {
    const password = `Aa1!${'x'.repeat(PASSWORD_MAX_LENGTH)}`
    expect(passwordSchema.safeParse(password).success).toBe(false)
  })

  it.each(['!', '@', '#', '$', '%', '^', '&', '*', '_', '-', '=', '?', '~', '`', '.'])(
    'counts %j as a special character',
    (symbol) => {
      expect(passwordSchema.safeParse(`Password1${symbol}`).success).toBe(true)
    },
  )

  it('does not count a symbol outside the Supabase set', () => {
    // Supabase would reject this server-side, so accepting it here would only
    // produce a confusing second failure.
    expect(passwordSchema.safeParse('Password1£').success).toBe(false)
  })
})

describe('registerSchema', () => {
  const valid = {
    firstName: 'Ori',
    lastName: 'Jakob',
    email: 'ori@example.com',
    password: 'Str0ng!Pass',
    confirmPassword: 'Str0ng!Pass',
  }

  it('accepts a complete form', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true)
  })

  it('reports mismatched confirmation against the confirm field', () => {
    const result = registerSchema.safeParse({ ...valid, confirmPassword: 'Different1!' })

    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue?.message).toBe('Passwords do not match.')
      expect(issue?.path).toEqual(['confirmPassword'])
    }
  })

  it.each(['firstName', 'lastName'] as const)('requires %s', (field) => {
    expect(registerSchema.safeParse({ ...valid, [field]: '   ' }).success).toBe(false)
  })

  it('trims surrounding whitespace from names', () => {
    const result = registerSchema.safeParse({ ...valid, firstName: '  Ori  ' })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.firstName).toBe('Ori')
  })

  it('rejects a name longer than 60 characters', () => {
    expect(registerSchema.safeParse({ ...valid, lastName: 'a'.repeat(61) }).success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts any non-empty password so existing accounts can still sign in', () => {
    expect(loginSchema.safeParse({ email: 'ori@example.com', password: 'weak' }).success).toBe(true)
  })

  it('requires a password', () => {
    const result = loginSchema.safeParse({ email: 'ori@example.com', password: '' })
    expect(firstError(result)).toBe('Password is required.')
  })

  it('still requires a valid email', () => {
    expect(loginSchema.safeParse({ email: 'nope', password: 'anything' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('applies the full password rules to the new password', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'weak',
      confirmPassword: 'weak',
    })
    expect(result.success).toBe(false)
  })

  it('requires the confirmation to match', () => {
    const result = resetPasswordSchema.safeParse({
      password: 'Str0ng!Pass',
      confirmPassword: 'Str0ng!Pas',
    })
    expect(firstError(result)).toBe('Passwords do not match.')
  })
})
