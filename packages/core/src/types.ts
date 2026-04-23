// ---------------------------------------------------------------------------
// Shared types for the ASO scoring pipeline.
//
// AppData is the contract between the fetcher (iTunes Lookup + App Store HTML
// scrape) and the scorer. Both the Expo web app and the Chrome extension
// produce this shape and feed it to `scoreApp`.
// ---------------------------------------------------------------------------

/** Fields returned directly by the iTunes Lookup API. */
export interface ITunesResult {
  trackName?: string;
  artistName?: string;
  description?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  currentVersionReleaseDate?: string;
  /** Original first-release date of the app (not per-version). */
  releaseDate?: string;
  releaseNotes?: string;
  languageCodesISO2A?: string[];
  primaryGenreName?: string;
  artworkUrl100?: string;
  artworkUrl512?: string;
  trackId?: number;
}

/**
 * Unified app record consumed by `scoreApp`. Merges iTunes Lookup fields
 * with the extras scraped from the App Store HTML page (subtitle,
 * screenshot counts, preview video).
 *
 * Scrape-derived fields are nullable: `null` means "unknown — scrape failed",
 * NOT "absent". The scorer treats `null` as `status: "unknown"` and excludes
 * the check from the denominator instead of scoring it zero.
 */
export interface AppData extends ITunesResult {
  subtitle: string | null;
  iphoneScreenshotCount: number | null;
  ipadScreenshotCount: number | null;
  hasPreviewVideo: boolean | null;
  dataWarnings: string[];
}

export type CategoryKey =
  | "title"
  | "description"
  | "visuals"
  | "social"
  | "freshness"
  | "localization";

export type CheckStatus = "pass" | "partial" | "fail" | "unknown";

export interface Check {
  cat: CategoryKey;
  key: string;
  label: string;
  status: CheckStatus;
  /** Max points this check can contribute to its category. */
  weight: number;
  detail: string;
  /** One-sentence fix recommendation, or null if the check passed. */
  fix: string | null;
}

export interface CategoryScore {
  /** Weighted points earned (rounded). */
  earned: number;
  /** Max possible, excluding "unknown" checks. */
  total: number;
  /** 0–100 percentage. */
  pct: number;
}

export interface ScoreResult {
  /** 0–100 overall score, rounded. */
  score: number;
  checks: Check[];
  categoryScores: Record<CategoryKey, CategoryScore>;
}
