CREATE TYPE "public"."case_size_band" AS ENUM('lt38', 'b38_42', 'gt42');--> statement-breakpoint
CREATE TYPE "public"."color_family" AS ENUM('black', 'white_silver', 'blue', 'green', 'brown_bronze', 'other');--> statement-breakpoint
CREATE TYPE "public"."occasion_tag" AS ENUM('daily', 'formal', 'travel', 'summer', 'office', 'outdoor');--> statement-breakpoint
CREATE TYPE "public"."primary_style" AS ENUM('diver', 'dress', 'field', 'chronograph', 'gmt_travel', 'pilot', 'sport_casual');--> statement-breakpoint
CREATE TYPE "public"."time_horizon" AS ENUM('short', 'mid', 'long', 'grail');--> statement-breakpoint
CREATE TYPE "public"."watch_status" AS ENUM('owned', 'wishlist', 'sold', 'grail');--> statement-breakpoint
CREATE TYPE "public"."wishlist_status_label" AS ENUM('researching', 'waiting_for_price_drop', 'ready_to_buy', 'dreaming');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar" text,
	"bio" text,
	"public_profile_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "watches" (
	"id" text PRIMARY KEY NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"reference" text,
	"year" integer,
	"case_size" numeric(4, 1),
	"thickness" numeric(4, 1),
	"lug_to_lug" numeric(4, 1),
	"movement_type" text,
	"dial_color" text,
	"material" text,
	"water_resistance" integer,
	"image_urls" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_watches" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"watch_id" text NOT NULL,
	"status" "watch_status" DEFAULT 'owned' NOT NULL,
	"primary_style" "primary_style" NOT NULL,
	"secondary_style" "primary_style",
	"occasion_tags" "occasion_tag"[] NOT NULL,
	"case_size_band" "case_size_band",
	"color_family" "color_family",
	"purchase_price" numeric(10, 2),
	"purchase_date" timestamp with time zone,
	"market_value_estimate" numeric(10, 2),
	"notes" text,
	"story" text,
	"is_public" boolean DEFAULT false NOT NULL,
	"serial_number" text,
	"fit_score" integer,
	"time_horizon" time_horizon,
	"target_price" numeric(10, 2),
	"wishlist_reason" text,
	"wishlist_blockers" text,
	"wishlist_status_label" "wishlist_status_label",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_watches" ADD CONSTRAINT "user_watches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_watches" ADD CONSTRAINT "user_watches_watch_id_watches_id_fk" FOREIGN KEY ("watch_id") REFERENCES "public"."watches"("id") ON DELETE restrict ON UPDATE no action;