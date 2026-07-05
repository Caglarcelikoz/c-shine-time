import { getServerSession } from "next-auth"
import { getLocale } from "next-intl/server"
import { authOptions } from "@/lib/auth/config"
import { AppNav } from "@/components/nav/app-nav"
import { redirect } from "@/i18n/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) {
    const locale = await getLocale()
    redirect({ href: "/login", locale })
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppNav session={session} />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
