export const PROFILE_THEMES = ["classic", "ivory", "noir", "navy"] as const;
export type ProfileTheme = (typeof PROFILE_THEMES)[number];

export const THEME_LABELS: Record<ProfileTheme, string> = {
  classic: "Classic",
  ivory: "Ivory",
  noir: "Noir",
  navy: "Navy",
};

export const THEME_DESCRIPTIONS: Record<ProfileTheme, string> = {
  classic: "Dark gold — the original C-Shine Time look.",
  ivory: "Light parchment, editorial serif.",
  noir: "Deep black, silver accents.",
  navy: "Deep navy with brass.",
};

/** Static background swatch color for each theme (used in the picker preview). */
export const THEME_SWATCH_BG: Record<ProfileTheme, string> = {
  classic: "oklch(0.13 0.005 60)",
  ivory: "oklch(0.96 0.01 80)",
  noir: "oklch(0.08 0.002 0)",
  navy: "oklch(0.18 0.05 250)",
};

/** Static accent swatch color for each theme. */
export const THEME_SWATCH_ACCENT: Record<ProfileTheme, string> = {
  classic: "oklch(0.72 0.06 75)",
  ivory: "oklch(0.45 0.06 60)",
  noir: "oklch(0.78 0.01 0)",
  navy: "oklch(0.72 0.08 80)",
};
