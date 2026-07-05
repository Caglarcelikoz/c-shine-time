CREATE TYPE "public"."document_type" AS ENUM('warranty', 'receipt', 'insurance', 'other');--> statement-breakpoint
CREATE TABLE "documents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"user_watch_id" text NOT NULL,
	"doc_type" "document_type" DEFAULT 'other' NOT NULL,
	"file_name" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text,
	"size" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_watches" ADD COLUMN "wear_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_watches" ADD COLUMN "last_worn_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_watches" ADD COLUMN "last_service_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_watches" ADD COLUMN "next_service_due" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_watches" ADD COLUMN "warranty_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_watch_id_user_watches_id_fk" FOREIGN KEY ("user_watch_id") REFERENCES "public"."user_watches"("id") ON DELETE cascade ON UPDATE no action;