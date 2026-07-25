import { z } from "zod"

/** Shared email field — trimmed and lower-cased so lookups, the unique constraint,
 *  and rate-limit keys are all case-insensitive. */
export const EmailSchema = z
  .email({ error: "Please enter a valid email address." })
  .trim()
  .toLowerCase()

/** Shared password policy — reused by register and password reset.
 *  Never trimmed/transformed: the stored hash must match exactly what the user
 *  types at login. Max 72 — bcrypt ignores bytes beyond that anyway. */
export const PasswordSchema = z
  .string()
  .min(8, { error: "Password must be at least 8 characters." })
  .max(72, { error: "Password must be 72 characters or fewer." })
  .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
  .regex(/[0-9]/, { error: "Password must contain at least one number." })

export const RegisterSchema = z.object({
  name: z.string().min(2, { error: "Name must be at least 2 characters." }).trim(),
  username: z
    .string()
    .min(3, { error: "Username must be at least 3 characters." })
    .max(30, { error: "Username must be 30 characters or fewer." })
    .regex(/^[a-z0-9_-]+$/, {
      error: "Username can only contain lowercase letters, numbers, hyphens, and underscores.",
    })
    .trim(),
  email: EmailSchema,
  password: PasswordSchema,
})

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, { error: "Password is required." }),
})

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: PasswordSchema,
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined
