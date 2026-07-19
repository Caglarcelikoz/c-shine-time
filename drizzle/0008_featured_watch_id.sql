ALTER TABLE "users" ADD COLUMN "featured_watch_id" text;--> statement-breakpoint
-- ADR 0006 — FK added by hand (the schema declares a plain column to avoid a
-- circular import). ON DELETE SET NULL: deleting the featured watch clears the
-- pointer; app-level live validation handles private/sold transitions.
ALTER TABLE "users" ADD CONSTRAINT "users_featured_watch_id_user_watches_id_fk" FOREIGN KEY ("featured_watch_id") REFERENCES "public"."user_watches"("id") ON DELETE set null ON UPDATE no action;