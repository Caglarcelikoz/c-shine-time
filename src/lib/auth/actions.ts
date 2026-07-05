"use server"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { getLocale } from "next-intl/server"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { redirect } from "@/i18n/navigation"
import { RegisterSchema, type ActionState } from "@/lib/definitions"

export async function register(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  }

  const result = RegisterSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const { name, username, email, password } = result.data

  const [existingEmail] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingEmail) {
    return { errors: { email: ["An account with this email already exists."] } }
  }

  const [existingUsername] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (existingUsername) {
    return { errors: { username: ["This username is already taken."] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await db.insert(users).values({ name, username, email, passwordHash })

  redirect({
    href: { pathname: "/login", query: { registered: "1" } },
    locale: await getLocale(),
  })
}
