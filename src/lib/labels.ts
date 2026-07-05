import type {
  CaseSizeBand,
  ColorFamily,
  OccasionTag,
  PrimaryStyle,
  TimeHorizon,
  WatchStatus,
  WishlistStatusLabel,
} from "@/lib/types"

export const PRIMARY_STYLE_LABELS: Record<PrimaryStyle, string> = {
  diver: "Diver",
  dress: "Dress",
  field: "Field",
  chronograph: "Chronograph",
  gmt_travel: "GMT / Travel",
  pilot: "Pilot",
  sport_casual: "Sport / Casual",
}

export const OCCASION_TAG_LABELS: Record<OccasionTag, string> = {
  daily: "Daily",
  formal: "Formal",
  travel: "Travel",
  summer: "Summer",
  office: "Office",
  outdoor: "Outdoor",
}

export const WATCH_STATUS_LABELS: Record<WatchStatus, string> = {
  owned: "Owned",
  wishlist: "Wishlist",
  sold: "Sold",
  grail: "Grail",
}

export const CASE_SIZE_BAND_LABELS: Record<CaseSizeBand, string> = {
  lt38: "Under 38mm",
  b38_42: "38–42mm",
  gt42: "Over 42mm",
}

export const COLOR_FAMILY_LABELS: Record<ColorFamily, string> = {
  black: "Black",
  white_silver: "White / Silver",
  blue: "Blue",
  green: "Green",
  brown_bronze: "Brown / Bronze",
  other: "Other",
}

export const TIME_HORIZON_LABELS: Record<TimeHorizon, string> = {
  short: "Short term",
  mid: "Mid term",
  long: "Long term",
  grail: "The grail",
}

export const TIME_HORIZON_SUBTITLES: Record<TimeHorizon, string> = {
  short: "Next 6 months",
  mid: "6–18 months",
  long: "2+ years",
  grail: "Lifetime",
}

export const WISHLIST_STATUS_LABELS: Record<WishlistStatusLabel, string> = {
  researching: "Researching",
  waiting_for_price_drop: "Waiting for price drop",
  ready_to_buy: "Ready to buy",
  dreaming: "Dreaming",
}
