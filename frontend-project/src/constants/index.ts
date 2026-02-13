export const EMPTY_CHART_DATA: number[] = [];

export const CACHE_KEYS = {
  CRYPTO_ICON_PREFIX: "crypto_icon_",
} as const;

export const API_DELAYS = {
  ICON_BATCH_DELAY: 500,
  CHART_REFRESH_INTERVAL: 60000,
} as const;

export const BATCH_SIZES = {
  ICON_PRELOAD: 5,
  CHART_DATA: 4,
} as const;

export const INTERSECTION_OBSERVER_OPTIONS = {
  rootMargin: "50px",
  threshold: 0.1,
} as const;

export const CHART_COLORS = {
  POSITIVE: "#10b981",
  NEGATIVE: "#ef4444",
} as const;
