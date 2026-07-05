import {
  caseSizeBandEnum,
  colorFamilyEnum,
  occasionTagEnum,
  primaryStyleEnum,
  timeHorizonEnum,
  watchStatusEnum,
  wishlistStatusLabelEnum,
} from "@/lib/db/schema"
import type { UserWatch, Watch } from "@/lib/db/schema"

export type PrimaryStyle = (typeof primaryStyleEnum.enumValues)[number]
export type OccasionTag = (typeof occasionTagEnum.enumValues)[number]
export type WatchStatus = (typeof watchStatusEnum.enumValues)[number]
export type CaseSizeBand = (typeof caseSizeBandEnum.enumValues)[number]
export type ColorFamily = (typeof colorFamilyEnum.enumValues)[number]
export type TimeHorizon = (typeof timeHorizonEnum.enumValues)[number]
export type WishlistStatusLabel = (typeof wishlistStatusLabelEnum.enumValues)[number]

export const PRIMARY_STYLES = primaryStyleEnum.enumValues
export const OCCASION_TAGS = occasionTagEnum.enumValues
export const WATCH_STATUSES = watchStatusEnum.enumValues
export const TIME_HORIZONS = timeHorizonEnum.enumValues
export const WISHLIST_STATUS_LABELS_VALUES = wishlistStatusLabelEnum.enumValues

/** A UserWatch joined with its catalog Watch — the shape used across the UI. */
export type CollectionItem = UserWatch & { watch: Watch }
