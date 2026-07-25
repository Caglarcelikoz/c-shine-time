import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { checkRateLimit } from "./rate-limit"
import { clientIpFromHeaders } from "./ip"
import { EMAIL_UNVERIFIED_ERROR, RATE_LIMITED_ERROR } from "./errors"

/** Valid cost-12 hash of a throwaway string. Compared against when the email has
 *  no account so both branches pay the same bcrypt cost — otherwise response
 *  timing reveals whether an account exists. */
const TIMING_EQUALIZER_HASH =
  "$2b$12$WnUJoE4dEa8/JeUiKc6aKOO8QAf2.fNxaMYgErIr0ykmOyl/mVAyy"

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days (explicit)
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.trim().toLowerCase()

        const ip = clientIpFromHeaders(req?.headers)
        const [ipOk, emailOk] = await Promise.all([
          checkRateLimit("login", `ip:${ip}`),
          checkRateLimit("login", `email:${email}`),
        ])
        if (!ipOk.success || !emailOk.success) {
          throw new Error(RATE_LIMITED_ERROR)
        }

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

        if (!user) {
          await bcrypt.compare(credentials.password, TIMING_EQUALIZER_HASH)
          return null
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )
        if (!passwordMatch) return null

        if (!user.emailVerified) {
          throw new Error(EMAIL_UNVERIFIED_ERROR)
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as { username?: string }).username ?? ""
        token.avatar = (user as { avatar?: string | null }).avatar ?? null
      }
      return token
    },
    async session({ session, token }) {
      const iatMs = typeof token.iat === "number" ? token.iat * 1000 : 0
      if (token.id) {
        const [row] = await db
          .select({ passwordChangedAt: users.passwordChangedAt })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1)
        const cutoff = row?.passwordChangedAt?.getTime() ?? 0
        const staleOrUnprovable = cutoff > 0 && (iatMs === 0 || iatMs < cutoff)
        if (!row || staleOrUnprovable) {
          return { ...session, user: undefined as never, expires: session.expires }
        }
      }

      if (token) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.avatar = token.avatar as string | null
      }
      return session
    },
  },
}
