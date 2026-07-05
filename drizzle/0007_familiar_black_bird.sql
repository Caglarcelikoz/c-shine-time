CREATE TABLE "watch_catalog" (
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
	"primary_style" "primary_style" NOT NULL,
	"occasion_tags" "occasion_tag"[] NOT NULL
);
--> statement-breakpoint
CREATE INDEX "watch_catalog_brand_model_idx" ON "watch_catalog" USING btree ("brand","model");