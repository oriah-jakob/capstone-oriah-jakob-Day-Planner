import { z } from 'zod'

/**
 * Validation for the authentication forms (FR-1).
 *
 * These schemas exist to give the user a clear, immediate error message. They
 * are NOT the enforcement point: Supabase Auth independently rejects weak
 * passwords using the policy in supabase/config.toml, so bypassing the browser
 * and posting straight to the API gains nothing.
 */

/**
 * The symbol set Supabase counts as a "special character". Kept identical to
 * theirs on purpose — a client that accepted `£` would pass validation here and
 * then be rejected server-side with a vaguer message.
 */
export const ALLOWED_SPECIAL_CHARACTERS = '!@#$%^&*()_+-=[]{};\'\\:"|<>?,./`~'

const SPECIAL_CHARACTER = /[!@#$%^&*()_+\-=[\]{};'\\:"|<>?,./`~]/
const UPPERCASE = /[A-Z]/
const LOWERCASE = /[a-z]/
const DIGIT = /[0-9]/

/** FR-1.3 minimum length. */
export const PASSWORD_MIN_LENGTH = 8

/**
 * bcrypt only considers the first 72 bytes. Rejecting longer input is honest;
 * silently ignoring the tail is not.
 */
export const PASSWORD_MAX_LENGTH = 72

export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email address is required.')
  .max(254, 'Email address is too long.')
  .pipe(z.email('Enter a valid email address.'))
  .transform((value) => value.toLowerCase())

const nameSchema = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(60, `${label} must be 60 characters or fewer.`)

/** FR-1.3: at least 8 characters, one uppercase, one lowercase, one number, one special. */
export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
  .max(PASSWORD_MAX_LENGTH, `Password must be ${PASSWORD_MAX_LENGTH} characters or fewer.`)
  .regex(UPPERCASE, 'Password must include an uppercase letter.')
  .regex(LOWERCASE, 'Password must include a lowercase letter.')
  .regex(DIGIT, 'Password must include a number.')
  .regex(SPECIAL_CHARACTER, 'Password must include a special character.')

/**
 * What the server actually needs to create an account. The confirmation field
 * is a browser-only affordance, so the API schema stays free of it while both
 * sides share one definition of the rules.
 */
export const registerAccountSchema = z.object({
  firstName: nameSchema('First name'),
  lastName: nameSchema('Last name'),
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = registerAccountSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

/**
 * Login deliberately does not apply the password rules. Accounts created before
 * a policy change must still be able to sign in, and echoing the composition
 * rules back on a failed login tells an attacker what to generate.
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.'),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.input<typeof registerSchema>
export type LoginInput = z.input<typeof loginSchema>
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>

export type RegisterValues = z.output<typeof registerSchema>
export type LoginValues = z.output<typeof loginSchema>
