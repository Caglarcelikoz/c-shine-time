import { pgEnum } from "drizzle-orm/pg-core"

export const watchStatusEnum = pgEnum("watch_status", [
  "owned",
  "wishlist",
  "sold",
  "grail",
])

export const primaryStyleEnum = pgEnum("primary_style", [
  "diver",
  "dress",
  "field",
  "chronograph",
  "gmt_travel",
  "pilot",
  "sport_casual",
])

export const occasionTagEnum = pgEnum("occasion_tag", [
  "daily",
  "formal",
  "travel",
  "summer",
  "office",
  "outdoor",
])

export const caseSizeBandEnum = pgEnum("case_size_band", [
  "lt38",
  "b38_42",
  "gt42",
])

export const colorFamilyEnum = pgEnum("color_family", [
  "black",
  "white_silver",
  "blue",
  "green",
  "brown_bronze",
  "other",
])

export const timeHorizonEnum = pgEnum("time_horizon", [
  "short",
  "mid",
  "long",
  "grail",
])

export const wishlistStatusLabelEnum = pgEnum("wishlist_status_label", [
  "researching",
  "waiting_for_price_drop",
  "ready_to_buy",
  "dreaming",
])
