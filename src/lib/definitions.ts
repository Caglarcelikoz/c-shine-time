import { z } from "zod"

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
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  password: z
    .string()
    .min(8, { error: "Password must be at least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Password must contain at least one letter." })
    .regex(/[0-9]/, { error: "Password must contain at least one number." })
    .trim(),
})

export const LoginSchema = z.object({
  email: z.email({ error: "Please enter a valid email address." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>

export type ActionState =
  | { errors?: Record<string, string[]>; message?: string }
  | undefined
