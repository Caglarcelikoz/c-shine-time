"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2Icon, Trash2Icon } from "lucide-react"
import { deleteWatch } from "@/lib/collection/actions"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
} from "@/components/ui/alert-dialog"

export function DeleteWatchButton({
  id,
  watchName,
}: {
  id: string
  watchName: string
}) {
  const t = useTranslations("CollectionDetail")
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteWatch(id)
      if (result?.error) {
        toast.error(t("deleteError"))
        setOpen(false)
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button variant="destructive" size="sm">
            <Trash2Icon />
            {t("delete")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
        <AlertDialogDescription>
          {t("deleteConfirmBody", { name: watchName })}
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button variant="ghost" size="sm" disabled={isPending}>
                {t("cancel")}
              </Button>
            }
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="animate-spin" />}
            {isPending ? t("deleting") : t("delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
