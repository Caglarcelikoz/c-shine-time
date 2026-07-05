"use client"

import { useRef, useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { runAdvisor } from "@/lib/ai/actions"
import {
  ADVISOR_ACTIONS,
  type AdvisorActionId,
  type AdvisorResponse,
} from "@/lib/ai/types"
import type { TagScore } from "@/lib/rule-engine"
import { TasteProfileBars } from "@/components/taste-profile-bars"
import { RecommendationCard } from "./recommendation-card"

interface Turn {
  role: "user" | "advisor"
  text?: string
  response?: AdvisorResponse
}

interface AdvisorProps {
  tagScores: TagScore[]
  ownedCount: number
  wishlistCount: number
  insights: { label: string; body: string }[]
}

export function Advisor({
  tagScores,
  ownedCount,
  wishlistCount,
  insights,
}: AdvisorProps) {
  const t = useTranslations("Advisor")
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState("")
  const [pending, startTransition] = useTransition()
  const scrollRef = useRef<HTMLDivElement>(null)

  const ACTION_LABELS: Record<Exclude<AdvisorActionId, "chat">, string> = {
    recommend_next: t("action.recommendNext"),
    find_gaps: t("action.findGaps"),
    what_to_sell: t("action.whatToSell"),
    alternatives_budget: t("action.alternativesBudget"),
    build_three: t("action.buildThree"),
    roast: t("action.roast"),
    compare: t("action.compare"),
    prioritize_wishlist: t("action.prioritizeWishlist"),
  }

  function scrollToBottom() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
    })
  }

  function dispatch(action: AdvisorActionId, label: string, userText?: string) {
    if (pending) return
    setTurns((t) => [...t, { role: "user", text: userText ?? label }])
    scrollToBottom()
    startTransition(async () => {
      const response = await runAdvisor(action, userText)
      setTurns((t) => [...t, { role: "advisor", response }])
      scrollToBottom()
    })
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || pending) return
    setInput("")
    dispatch("chat", text, text)
  }

  return (
    <div>
      <div className="mb-8">
        <p className="label-gold-caps mb-2">{t("personalCurator")}</p>
        <h1 className="font-serif text-4xl font-medium">{t("pageTitle")}</h1>
        <p className="text-muted-foreground text-sm mt-2">
          {t("analyzing", { ownedCount, wishlistCount })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Left — actions + taste */}
        <div className="space-y-4">
          <div className="rounded-sm border border-border bg-card p-5">
            <p className="label-caps mb-4">{t("suggestedActions")}</p>
            <div className="space-y-2">
              {ADVISOR_ACTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => dispatch(a, ACTION_LABELS[a])}
                  disabled={pending}
                  className="w-full text-left px-4 py-3 rounded-sm border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-50"
                >
                  {ACTION_LABELS[a]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-sm border border-border bg-card p-5">
            <p className="label-caps mb-4">{t("yourTasteProfile")}</p>
            <TasteProfileBars scores={tagScores} />
          </div>
        </div>

        {/* Right — conversation */}
        <div className="rounded-sm border border-border bg-card flex flex-col min-h-[560px]">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="font-serif text-lg">{t("wristfolioAdvisor")}</p>
              <p className="label-caps">{t("groundedInCollection")}</p>
            </div>
            {turns.length > 0 && (
              <button
                onClick={() => setTurns([])}
                className="label-caps hover:text-foreground transition-colors"
              >
                {t("reset")}
              </button>
            )}
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 max-h-[560px]">
            {turns.length === 0 && (
              <div className="h-full flex items-center justify-center text-center">
                <p className="text-muted-foreground text-sm max-w-xs">
                  {t("emptyStateHint")}
                </p>
              </div>
            )}

            {turns.map((turn, i) =>
              turn.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-sm bg-secondary px-4 py-2.5 text-sm">
                    {turn.text}
                  </div>
                </div>
              ) : (
                <AdvisorBubble key={i} response={turn.response!} />
              )
            )}

            {pending && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {t("thinking")}
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("inputPlaceholder")}
              disabled={pending}
              className="flex-1 bg-background border border-border rounded-sm px-3 h-10 text-sm focus:outline-none focus:border-foreground/30"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="px-5 bg-primary text-primary-foreground text-[10px] tracking-[0.18em] uppercase font-sans rounded-sm disabled:opacity-50"
            >
              {t("send")}
            </button>
          </form>
        </div>
      </div>

      {/* Bottom — rule-based insight cards */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          {insights.map((ins) => (
            <div key={ins.label} className="rounded-sm border border-border bg-card p-4">
              <p className="label-gold-caps mb-1">{ins.label}</p>
              <p className="text-sm text-muted-foreground">{ins.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdvisorBubble({ response }: { response: AdvisorResponse }) {
  const t = useTranslations("Advisor")
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[10px] font-serif text-primary shrink-0 mt-0.5">
          W
        </span>
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {response.message}
        </p>
      </div>

      {response.recommendations.length > 0 && (
        <div className="space-y-3 pl-9">
          {response.recommendations.map((rec, i) => (
            <RecommendationCard key={i} rec={rec} />
          ))}
        </div>
      )}

      {response.references.length > 0 && (
        <div className="space-y-2 pl-9">
          {response.references.map((ref, i) => (
            <Link
              key={i}
              href={`/collection/${ref.item.id}`}
              className="flex items-center justify-between gap-4 rounded-sm border border-border bg-background px-4 py-3 hover:border-foreground/20 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-foreground truncate">
                  {ref.item.watch.brand} {ref.item.watch.model}
                </p>
                <p className="text-xs text-muted-foreground">{ref.note}</p>
              </div>
              {ref.fitScore != null && (
                <span className="shrink-0 text-right">
                  <span className="label-gold-caps">{t("fit")}</span>{" "}
                  <span className="font-serif text-lg text-primary">{ref.fitScore}</span>
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
