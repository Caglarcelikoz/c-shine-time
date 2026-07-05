ALTER TABLE "users" ADD COLUMN "hide_collection_value" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_purchase_prices" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_wishlist" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_sold_archive" boolean DEFAULT false NOT NULL;