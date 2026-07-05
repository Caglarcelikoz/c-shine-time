"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { register } from "@/lib/auth/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  const t = useTranslations("Auth");
  const [state, action, pending] = useActionState(register, undefined);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <h1 className="font-serif text-3xl font-medium mb-2">
          {t("createAccount")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("startBuilding")}</p>
      </div>

      <form action={action} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="label-caps">
            {t("fullName")}
          </Label>
          <Input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="name"
            className="bg-card border-border"
          />
          {state?.errors?.name && (
            <p className="text-xs text-destructive">{state.errors.name[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username" className="label-caps">
            {t("username")}
          </Label>
          <div className="flex items-center gap-0 rounded-sm border border-border bg-card overflow-hidden">
            <span className="px-3 text-sm text-muted-foreground border-r border-border h-9 flex items-center">
              time.cshinedigital.com/
            </span>
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="username"
              className="border-0 bg-transparent focus-visible:ring-0 rounded-none"
            />
          </div>
          {state?.errors?.username && (
            <p className="text-xs text-destructive">
              {state.errors.username[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="label-caps">
            {t("email")}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="email"
            className="bg-card border-border"
          />
          {state?.errors?.email && (
            <p className="text-xs text-destructive">{state.errors.email[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="label-caps">
            {t("password")}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={t("passwordPlaceholder")}
            className="bg-card border-border"
          />
          {state?.errors?.password && (
            <p className="text-xs text-destructive">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {state?.message && (
          <p className="text-sm text-destructive text-center">
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {pending ? t("creatingAccount") : t("createAccount")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
