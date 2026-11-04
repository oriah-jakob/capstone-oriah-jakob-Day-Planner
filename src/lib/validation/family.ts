import { z } from 'zod'

import { emailSchema } from '@/lib/validation/auth'

export const FAMILY_NAME_MAX_LENGTH = 60

/** FR-16. The length limit matches the families table check. */
export const createFamilySchema = z.object({
  familyName: z
    .string()
    .trim()
    .min(1, 'Family name is required.')
    .max(
      FAMILY_NAME_MAX_LENGTH,
      `Family name must be ${FAMILY_NAME_MAX_LENGTH} characters or fewer.`,
    ),
})

/** FR-17: the server decides whether the address belongs to an account that can join. */
export const addMemberSchema = z.object({
  email: emailSchema,
})

export type CreateFamilyInput = z.input<typeof createFamilySchema>
export type AddMemberInput = z.input<typeof addMemberSchema>
