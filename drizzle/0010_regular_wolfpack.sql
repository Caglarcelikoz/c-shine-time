CREATE TABLE "rate_limit_hits" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"hit_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "rate_limit_hits_key_hit_at_idx" ON "rate_limit_hits" USING btree ("key","hit_at");