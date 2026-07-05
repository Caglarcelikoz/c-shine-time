"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateUsername } from "@/lib/settings/actions";
import { Input } from "@/components/ui/input";

export function UsernameForm({ initial }: { initial: string }) {
  const t = useTranslations("Settings");
  const [state, action, pending] = useActionState(updateUsername, undefined);

  return (
    <form
      action={action}
      className="rounded-sm border border-border bg-card p-6"
    >
      <p className="label-caps mb-3">{t("publicUsername")}</p>
      <div className="flex items-center gap-0 rounded-sm border border-border bg-background overflow-hidden">
        <span className="px-3 text-sm text-muted-foreground border-r border-border h-10 flex items-center shrink-0">
          time.cshinedigital.com/
        </span>
        <Input
          name="username"
          defaultValue={initial}
          className="border-0 bg-transparent focus-visible:ring-0 rounded-none h-10"
        />
        <button
          type="submit"
          disabled={pending}
          className="px-5 h-10 text-[10px] tracking-[0.18em] uppercase font-sans text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 shrink-0"
        >
          {pending ? "…" : t("save")}
        </button>
      </div>
      {state?.errors?.username && (
        <p className="text-xs text-destructive mt-2">
          {state.errors.username[0]}
        </p>
      )}
      {state?.message && !state.errors && (
        <p className="text-xs text-primary mt-2">{state.message}</p>
      )}
    </form>
  );
}
