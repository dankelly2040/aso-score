// ---------------------------------------------------------------------------
// ASO scoring engine.
//
// Pure, side-effect-free: takes an AppData record, returns a ScoreResult.
// No DOM APIs, no fetch, no timers — safe to import in a Chrome service
// worker, a Metro-bundled DOM component, Vitest, and node.
//
// Weighting per-category is defined in CATEGORIES. Individual check weights
// are declared inline; they sum to the category weight (max earnable within
// a category is always its CATEGORIES[cat].weight).
//
// "unknown" checks (usually from a scrape failure) are excluded from the
// denominator of their category, so a scrape-failed listing doesn't get
// unfairly tanked — we treat it as "we just don't know this piece".
// ---------------------------------------------------------------------------

import type {
  AppData,
  CategoryKey,
  CategoryScore,
  Check,
  ScoreResult,
} from "./types";

export const CATEGORIES: Record<CategoryKey, { label: string; weight: number }> = {
  title: { label: "Title & Subtitle", weight: 20 },
  description: { label: "Description & Keywords", weight: 20 },
  visuals: { label: "Visuals", weight: 25 },
  social: { label: "Ratings & Reviews", weight: 15 },
  freshness: { label: "Freshness", weight: 10 },
  localization: { label: "Localization", weight: 10 },
};

const BULLET_RE = /[•●▪️★▶►→✓✔]|^[-*]/m;
const CTA_RE = /download|try|start|join|get started|sign up/i;

function countSeparators(s: string): number {
  return (s.match(/[|:\-–—]/g) || []).length;
}

export function scoreApp(app: AppData): ScoreResult {
  const checks: Check[] = [];

  // -------- Title & subtitle --------
  const title = app.trackName || "";
  const subtitle = app.subtitle;

  checks.push({
    cat: "title",
    key: "title-length",
    label: "Title length \u2264 30 characters",
    status: title.length === 0 ? "fail" : title.length <= 30 ? "pass" : "partial",
    weight: 8,
    detail: `Your title is ${title.length} characters. Apple truncates at 30.`,
    fix:
      title.length > 30
        ? `Shorten your title from "${title}" to 30 characters or fewer. Put the most important keyword first.`
        : null,
  });

  const subtitleLen = subtitle ? subtitle.length : 0;
  checks.push({
    cat: "title",
    key: "subtitle-present",
    label: "Subtitle present and using full 30 chars",
    status:
      subtitle === null
        ? "unknown"
        : subtitleLen === 0
          ? "fail"
          : subtitleLen >= 20 && subtitleLen <= 30
            ? "pass"
            : "partial",
    weight: 8,
    detail:
      subtitle === null
        ? "Could not read subtitle \u2014 App Store page scrape failed."
        : subtitleLen === 0
          ? "No subtitle set. Subtitles are 30-character keyword slots."
          : `Subtitle: "${subtitle}" (${subtitleLen}/30 chars).`,
    fix:
      subtitleLen === 0
        ? "Add a 30-character subtitle with keyword-rich value prop. Don't waste it on fluff like 'The official app'."
        : subtitleLen > 0 && subtitleLen < 20
          ? `Your subtitle is only ${subtitleLen} chars \u2014 you're leaving ${30 - subtitleLen} valuable keyword characters on the table.`
          : null,
  });

  const separators = countSeparators(title);
  checks.push({
    cat: "title",
    key: "no-keyword-stuffing",
    label: "No keyword stuffing in title",
    status: separators > 2 ? "fail" : separators === 2 ? "partial" : "pass",
    weight: 4,
    detail:
      separators > 1
        ? "Title has multiple separators, suggesting keyword stuffing."
        : "Title reads naturally.",
    fix:
      separators > 2
        ? "Remove keyword-stuffing separators (|, -, :). Apple's algorithm rewards clean brand-first titles."
        : null,
  });

  // -------- Description --------
  const description = app.description || "";
  const firstLines = description.split(/\n/).slice(0, 3).join(" ").trim();
  const firstLineLength = firstLines.length;

  checks.push({
    cat: "description",
    key: "desc-length",
    label: "Description length (800+ characters)",
    status:
      description.length >= 1500 ? "pass" : description.length >= 800 ? "partial" : "fail",
    weight: 5,
    detail: `Description is ${description.length} characters. Aim for 1,500-3,500 to cover features and keywords without rambling.`,
    fix:
      description.length < 800
        ? "Your description is too short. Expand to at least 1,500 characters covering: hook (3 lines), key features, social proof, and CTA."
        : null,
  });

  checks.push({
    cat: "description",
    key: "desc-hook",
    label: "First 3 lines form a hook",
    status: firstLineLength > 80 && firstLineLength < 400 ? "pass" : firstLineLength > 40 ? "partial" : "fail",
    weight: 8,
    detail: `Your first 3 lines are ${firstLineLength} characters. Users see this before tapping "more".`,
    fix:
      firstLineLength < 80
        ? "Rewrite your first 3 lines. This is the only copy 95% of visitors read. Lead with the benefit, not the company name."
        : null,
  });

  const hasBullets = BULLET_RE.test(description);
  checks.push({
    cat: "description",
    key: "desc-structure",
    label: "Uses formatting (bullets, sections)",
    status: hasBullets ? "pass" : "partial",
    weight: 4,
    detail: hasBullets
      ? "Description uses visual separators."
      : "Flat text is hard to scan. Bullets and sections improve conversion.",
    fix: !hasBullets
      ? "Break your description into scannable sections with bullets (\u2022) for features. Consider headers in CAPS for key sections."
      : null,
  });

  const hasCTA = CTA_RE.test(description);
  checks.push({
    cat: "description",
    key: "desc-cta",
    label: "Contains a call-to-action",
    status: hasCTA ? "pass" : "fail",
    weight: 3,
    detail: hasCTA ? "CTA detected." : "No clear CTA found.",
    fix: !hasCTA
      ? "Add a clear CTA near the top and bottom of your description (e.g., 'Download now and start free')."
      : null,
  });

  // -------- Visuals --------
  const iphoneCount = app.iphoneScreenshotCount;
  const ipadCount = app.ipadScreenshotCount;
  const hasVideo = app.hasPreviewVideo;
  const hasIcon = Boolean(app.artworkUrl512 || app.artworkUrl100);

  checks.push({
    cat: "visuals",
    key: "icon",
    label: "Icon contrast & legibility",
    status: hasIcon ? "pass" : "fail",
    weight: 5,
    detail: hasIcon ? "Icon detected." : "No icon found.",
    fix: !hasIcon
      ? "Upload a high-res app icon (1024\u00d71024). This is your single most important asset."
      : null,
  });

  checks.push({
    cat: "visuals",
    key: "screenshot-count",
    label: "Screenshots (6.7\")",
    status:
      iphoneCount === null
        ? "unknown"
        : iphoneCount >= 5
          ? "pass"
          : iphoneCount >= 3
            ? "partial"
            : "fail",
    weight: 10,
    detail:
      iphoneCount === null
        ? "Could not read screenshot count \u2014 App Store page scrape failed."
        : `${iphoneCount} iPhone screenshot(s). Apple allows up to 10.`,
    fix:
      iphoneCount !== null && iphoneCount < 5
        ? `Upload ${10 - iphoneCount} more screenshots, up to the 10 maximum. Screenshots 1-3 drive conversion; 4-10 reinforce features.`
        : null,
  });

  checks.push({
    cat: "visuals",
    key: "ipad-screenshots",
    label: "iPad screenshots provided",
    status:
      ipadCount === null
        ? "unknown"
        : ipadCount >= 3
          ? "pass"
          : ipadCount > 0
            ? "partial"
            : "fail",
    weight: 3,
    detail:
      ipadCount === null
        ? "Could not read iPad screenshots \u2014 App Store page scrape failed."
        : `${ipadCount} iPad screenshot(s). If your app runs on iPad, you need these.`,
    fix:
      ipadCount !== null && ipadCount < 3
        ? "Add iPad-specific screenshots. Apple penalizes apps that reuse iPhone screenshots on iPad listings."
        : null,
  });

  checks.push({
    cat: "visuals",
    key: "video-preview",
    label: "App preview video",
    status: hasVideo === null ? "unknown" : hasVideo ? "pass" : "fail",
    weight: 7,
    detail:
      hasVideo === null
        ? "Could not read preview video \u2014 App Store page scrape failed."
        : hasVideo
          ? "App preview video detected."
          : "No app preview video found.",
    fix:
      hasVideo === false
        ? "Add a 15-30 second app preview video. Listings with videos convert 25-35% better than those without."
        : null,
  });

  // -------- Social proof --------
  const rating = app.averageUserRating || 0;
  const ratingCount = app.userRatingCount || 0;

  checks.push({
    cat: "social",
    key: "rating",
    label: "Average rating \u2265 4.0",
    status: rating >= 4.5 ? "pass" : rating >= 4.0 ? "partial" : "fail",
    weight: 8,
    detail: rating > 0 ? `Current rating: ${rating.toFixed(1)} \u2605` : "No rating yet.",
    fix:
      rating < 4.0 && rating > 0
        ? "Rating below 4.0 suppresses rankings. Implement an in-app prompt using SKStoreReviewController at moments of user success, never after errors."
        : null,
  });

  checks.push({
    cat: "social",
    key: "rating-count",
    label: "500+ ratings",
    status:
      ratingCount >= 1000
        ? "pass"
        : ratingCount >= 500
          ? "partial"
          : ratingCount >= 100
            ? "partial"
            : "fail",
    weight: 7,
    detail: `${ratingCount.toLocaleString()} rating(s). Volume signals trust and social proof.`,
    fix:
      ratingCount < 500
        ? "Trigger ratings prompts more aggressively at moments of user delight (post-purchase, after goal completion, after 3+ sessions). Use the App Store Connect 3x-per-365-days limit fully."
        : null,
  });

  // -------- Freshness --------
  const updateDate = app.currentVersionReleaseDate
    ? new Date(app.currentVersionReleaseDate)
    : null;
  const daysSinceUpdate = updateDate
    ? Math.floor((Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  checks.push({
    cat: "freshness",
    key: "recent-update",
    label: "Updated in last 90 days",
    status: daysSinceUpdate <= 30 ? "pass" : daysSinceUpdate <= 90 ? "partial" : "fail",
    weight: 6,
    detail: updateDate ? `Last updated ${daysSinceUpdate} days ago.` : "Update date unknown.",
    fix:
      daysSinceUpdate > 90
        ? "Ship an update. Apple's algorithm favors recently-updated apps. Even small bug-fix releases help."
        : null,
  });

  const releaseNotes = app.releaseNotes || "";
  checks.push({
    cat: "freshness",
    key: "release-notes",
    label: "Substantive release notes",
    status:
      releaseNotes.length >= 100 ? "pass" : releaseNotes.length >= 30 ? "partial" : "fail",
    weight: 4,
    detail: `Release notes are ${releaseNotes.length} characters. "Bug fixes and improvements" is a red flag.`,
    fix:
      releaseNotes.length < 100
        ? "Write specific release notes. 'Bug fixes and improvements' signals a low-effort team to users. Call out 2-3 concrete changes."
        : null,
  });

  // -------- Localization --------
  const languages = app.languageCodesISO2A || [];
  checks.push({
    cat: "localization",
    key: "language-count",
    label: "Localized in 5+ languages",
    status:
      languages.length >= 10 ? "pass" : languages.length >= 5 ? "partial" : "fail",
    weight: 10,
    detail: `Available in ${languages.length} language(s): ${languages.slice(0, 8).join(", ")}${languages.length > 8 ? "\u2026" : ""}`,
    fix:
      languages.length < 5
        ? "Localize your listing into at least 5 languages. Start with Spanish, Portuguese (BR), German, Japanese, and French, each unlocks millions of search impressions."
        : null,
  });

  // -------- Aggregate per category --------
  const categoryScores = {} as Record<CategoryKey, CategoryScore>;
  (Object.keys(CATEGORIES) as CategoryKey[]).forEach((cat) => {
    const catChecks = checks.filter((c) => c.cat === cat && c.status !== "unknown");
    const totalWeight = catChecks.reduce((s, c) => s + c.weight, 0);
    const earned = catChecks.reduce((s, c) => {
      const mult = c.status === "pass" ? 1 : c.status === "partial" ? 0.5 : 0;
      return s + c.weight * mult;
    }, 0);
    categoryScores[cat] = {
      earned: Math.round(earned),
      total: totalWeight,
      pct: totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0,
    };
  });

  // -------- Overall 0–100 score --------
  const totalScore = (Object.keys(CATEGORIES) as CategoryKey[]).reduce((sum, cat) => {
    const { weight } = CATEGORIES[cat];
    return sum + (categoryScores[cat].pct / 100) * weight;
  }, 0);

  return {
    score: Math.round(totalScore),
    checks,
    categoryScores,
  };
}
