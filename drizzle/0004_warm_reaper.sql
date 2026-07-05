CREATE TABLE "wear_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_watch_id" text NOT NULL,
	"worn_on" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "wear_logs_user_watch_id_worn_on_unique" UNIQUE("user_watch_id","worn_on")
);
--> statement-breakpoint
ALTER TABLE "wear_logs" ADD CONSTRAINT "wear_logs_user_watch_id_user_watches_id_fk" FOREIGN KEY ("user_watch_id") REFERENCES "public"."user_watches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watches" DROP COLUMN "wear_count";--> statement-breakpoint
ALTER TABLE "user_watches" DROP COLUMN "last_worn_at";