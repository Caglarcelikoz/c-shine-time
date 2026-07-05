"use client"

import { useActionState, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useFormatter, useTranslations } from "next-intl"
import { toggleWornOn, toggleWornToday, type WearSummary } from "@/lib/wear/actions"
import { updateService } from "@/lib/collection/actions"
import { fmtDate, fmtDateInput } from "@/lib/format"

interface WearServiceCardProps {
  id: string
  wearSummary: WearSummary
  purchasePrice: string | null
  currency: string
  lastServiceDate: Date | string | null
  nextServiceDue: Date | string | null
  warrantyExpiresAt: Date | string | null
}

function daysUntil(d: Date | string | null): number | null {
  if (!d) return null
  const date = typeof d === "string" ? new Date(d) : d
  if (Number.isNaN(date.getTime())) return null
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" | "over" }) {
  return (
    <div>
      <p className="label-caps mb-1">{label}</p>
      <p
        className={[
          "text-sm",
          tone === "over" ? "text-destructive" : tone === "warn" ? "text-primary" : "text-foreground",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  )
}

function dueTone(days: number | null): "warn" | "over" | undefined {
  if (days == null) return undefined
  if (days < 0) return "over"
  if (days <= 90) return "warn"
  return undefined
}

/** Day-of-month number, e.g. "14". */
function dayOfMonth(dateStr: string): string {
  return String(Number(dateStr.slice(8, 10)))
}

export function WearServiceCard(props: WearServiceCardProps) {
  const t = useTranslations("WearService")
  const format = useFormatter()
  const router = useRouter()
  const [, startTransition] = useTransition()

  /** Locale-aware short weekday, e.g. "Mon" / "ma" for a YYYY-MM-DD string. */
  function dayAbbrev(dateStr: string): string {
    return format.dateTime(new Date(dateStr + "T00:00:00"), { weekday: "short" })
  }

  /** "Today", "Yesterday", or e.g. "Mon 14" for a full readable label. */
  function dayFullLabel(dateStr: string, todayStr: string): string {
    if (dateStr === todayStr) return t("today")
    const yesterday = new Date(todayStr + "T00:00:00")
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().slice(0, 10)) return t("yesterday")
    return `${dayAbbrev(dateStr)} ${dayOfMonth(dateStr)}`
  }
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const [state, formAction, pending] = useActionState(
    updateService.bind(null, props.id),
    undefined
  )

  const { wearSummary: w } = props

  const nextDueDays = daysUntil(props.nextServiceDue)
  const warrantyDays = daysUntil(props.warrantyExpiresAt)

  function toggleDay(date: string) {
    setToggling(date)
    startTransition(async () => {
      await toggleWornOn(props.id, date)
      router.refresh()
      setToggling(null)
    })
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="rounded-sm border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <p className="label-gold-caps">{t("serviceAndWear")}</p>
        <button
          onClick={() => setEditing((e) => !e)}
          className="label-caps hover:text-foreground transition-colors"
        >
          {editing ? t("close") : t("editService")}
        </button>
      </div>

      {/* Worn-today toggle + mini calendar */}
      <div className="mb-6 pb-6 border-b border-border">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <p className="text-sm text-foreground">
              {w.wornToday ? t("wornToday") : t("wearItToday")}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("daysLogged", { count: w.totalWears })}
              {w.lastWornOn ? ` · ${t("lastWorn", { date: fmtDate(w.lastWornOn) ?? "" })}` : ""}
            </p>
          </div>
          <button
            onClick={() => toggleDay(today)}
            disabled={toggling === today}
            className={[
              "shrink-0 px-5 py-2.5 text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm transition-colors disabled:opacity-50",
              w.wornToday
                ? "border border-primary/40 text-primary hover:bg-primary/10"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
            ].join(" ")}
          >
            {toggling === today ? "…" : w.wornToday ? t("undo") : t("logToday")}
          </button>
        </div>

        {/* Last 14 days — click any day to toggle it */}
        <div className="flex gap-1.5">
          {w.recentDays.map((d) => (
            <button
              key={d.date}
              onClick={() => toggleDay(d.date)}
              disabled={toggling === d.date}
              title={dayFullLabel(d.date, today)}
              className="flex flex-col items-center gap-0.5 disabled:opacity-50"
            >
              <span className="text-[9px] text-muted-foreground leading-none">{dayAbbrev(d.date).slice(0, 1)}</span>
              <span className="text-[9px] text-muted-foreground leading-none">{dayOfMonth(d.date)}</span>
              <span
                className={[
                  "w-4 h-4 rounded-sm border transition-colors",
                  d.worn ? "bg-primary border-primary" : "border-border hover:border-foreground/40",
                ].join(" ")}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat label={t("timesWorn")} value={String(w.totalWears)} />
        <Stat label={t("lastService")} value={fmtDate(props.lastServiceDate) ?? "—"} />
        <Stat
          label={t("nextServiceDue")}
          value={
            fmtDate(props.nextServiceDue)
              ? `${fmtDate(props.nextServiceDue)}${nextDueDays != null && nextDueDays < 0 ? ` · ${t("overdue")}` : ""}`
              : "—"
          }
          tone={dueTone(nextDueDays)}
        />
        <Stat
          label={t("warrantyExpires")}
          value={
            fmtDate(props.warrantyExpiresAt)
              ? `${fmtDate(props.warrantyExpiresAt)}${warrantyDays != null && warrantyDays < 0 ? ` · ${t("expired")}` : ""}`
              : "—"
          }
          tone={dueTone(warrantyDays)}
        />
      </div>

      {editing && (
        <form action={formAction} className="mt-6 pt-6 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="label-caps mb-1.5 block">{t("lastServiceDate")}</label>
            <input
              type="date"
              name="lastServiceDate"
              defaultValue={fmtDateInput(props.lastServiceDate)}
              className="h-9 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{t("nextServiceDue")}</label>
            <input
              type="date"
              name="nextServiceDue"
              defaultValue={fmtDateInput(props.nextServiceDue)}
              className="h-9 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block">{t("warrantyExpires")}</label>
            <input
              type="date"
              name="warrantyExpiresAt"
              defaultValue={fmtDateInput(props.warrantyExpiresAt)}
              className="h-9 w-full rounded-sm border border-border bg-background px-3 text-sm text-foreground"
            />
          </div>
          <div className="sm:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm hover:bg-primary/90 disabled:opacity-50"
            >
              {pending ? t("saving") : t("saveServiceDetails")}
            </button>
            {state?.message && <span className="text-xs text-primary">{state.message}</span>}
          </div>
        </form>
      )}
    </div>
  )
}
