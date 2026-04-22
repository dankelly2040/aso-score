// ---------------------------------------------------------------------------
// Download estimates.
//
// Apple doesn't publish install counts, and the paid APIs that do
// (Sensor Tower, data.ai, AppFigures, AppTweak) all start at $500+/mo with
// no real free tier. So we fall back to a classic ASO rule-of-thumb:
// downloads ~= rating_count × a size-dependent ratio.
//
// Why the ratio is piecewise:
//   - Small apps (< 1k ratings) have passionate early users who rate often;
//     empirically ~1 rating per 75 downloads.
//   - Mid apps (1k–100k) hit the typical "average engaged user" band at
//     ~1 per 200 downloads.
//   - Large apps (100k+) pick up huge passive-user tails that rarely rate;
//     the ratio stretches to ~1 per 600 downloads.
//
// Dividing by months-since-first-release converts lifetime installs to a
// per-month figure. That's a blunt average (not "last 30 days"), but for
// an ASO audit it's directionally right and can't be gamed by a recent
// rating burst.
//
// Used by:
//   - Web app: shown as a context chip next to the score.
//   - Extension popup: same, in miniature.
// ---------------------------------------------------------------------------

import type { AppData } from "./types";

export interface DownloadEstimate {
  /** Estimated cumulative downloads across the app's lifetime. */
  lifetime: number;
  /** Estimated monthly downloads averaged across the app's lifetime. */
  monthly: number;
  /**
   * Qualitative confidence:
   *   - "low":  few ratings or very recent release → estimate may be off by >2×.
   *   - "med":  enough data for a usable ballpark.
   *   - "high": plenty of ratings and a mature release → reasonably tight.
   */
  confidence: "low" | "med" | "high";
  /** Human-readable formula, e.g. "12,483 ratings × 200 ÷ 18 months". */
  method: string;
}

/**
 * Estimate monthly and lifetime downloads from rating count + release date.
 *
 * Returns `null` when we lack the inputs needed to produce a meaningful
 * number (fewer than 10 ratings or missing/invalid release date). Callers
 * should show a "not enough data" state instead of rendering a fake zero.
 */
export function estimateDownloads(app: AppData): DownloadEstimate | null {
  const ratings = app.userRatingCount ?? 0;
  const releaseDate = app.releaseDate ? new Date(app.releaseDate) : null;

  if (ratings < 10 || !releaseDate || Number.isNaN(releaseDate.getTime())) {
    return null;
  }

  const ratio = ratings < 1_000 ? 75 : ratings < 100_000 ? 200 : 600;
  const lifetime = ratings * ratio;

  // Clamp to >= 1 month so a 3-day-old app doesn't report "lifetime/0.1 = huge".
  const monthsSinceRelease = Math.max(
    1,
    (Date.now() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375),
  );
  const monthly = Math.round(lifetime / monthsSinceRelease);

  const confidence: "low" | "med" | "high" =
    ratings >= 10_000 && monthsSinceRelease >= 6
      ? "high"
      : ratings >= 1_000 && monthsSinceRelease >= 3
        ? "med"
        : "low";

  const method =
    `${ratings.toLocaleString()} ratings × ${ratio} ÷ ` +
    `${monthsSinceRelease.toFixed(1)} months`;

  return { lifetime, monthly, confidence, method };
}

/**
 * Format a download count for display ("1.2M", "48K", "920").
 * Used on the web page and inside the extension popup.
 */
export function formatDownloadCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return n.toLocaleString();
}
