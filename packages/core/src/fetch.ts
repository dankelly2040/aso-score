// ---------------------------------------------------------------------------
// App Store data fetcher.
//
// Apple exposes two useful endpoints:
//   1. https://itunes.apple.com/lookup — structured JSON, CORS-friendly,
//      gives us description, ratings, release dates, icon URLs, languages.
//   2. https://apps.apple.com/{country}/app/.../id{id} — the real product
//      page HTML, which carries the fields the lookup API *doesn't*:
//      subtitle, screenshot counts per form factor, preview videos.
//      We scrape these from the embedded <script id="serialized-server-data">
//      JSON blob.
//
// Both calls use the global `fetch`, so the same code runs in three places:
//   - Expo Router API route (`apps/web/app/api/fetch-app+api.ts`)
//   - Extension service worker (apps.apple.com is in host_permissions)
//   - Node-based Vitest tests (via fetch polyfill / undici)
//
// The HTML scrape is best-effort: if Apple changes the page structure or
// blocks us, we return `null` for the scrape-derived fields and let the
// scorer mark those checks as "unknown". That's much better than polluting
// the score with zeros for data we simply couldn't read.
// ---------------------------------------------------------------------------

import type { AppData, ITunesResult } from "./types";

interface MediaShelfSummary {
  subtitle: string | null;
  iphoneScreenshotCount: number | null;
  ipadScreenshotCount: number | null;
  hasPreviewVideo: boolean | null;
  htmlParseError?: string;
}

// A recent desktop Chrome UA. Apple returns a stripped mobile page if we look
// like anything unfamiliar, and the serialized-server-data script only ships
// on the desktop variant.
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

async function fetchITunes(
  id: string,
  country: string,
): Promise<ITunesResult> {
  const url =
    `https://itunes.apple.com/lookup?id=${id}` +
    `&country=${country}&entity=software`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes lookup failed: ${res.status}`);
  const data = (await res.json()) as {
    resultCount: number;
    results: ITunesResult[];
  };
  if (!data.results || data.results.length === 0) {
    throw new Error("App not found. Double-check the URL or ID.");
  }
  return data.results[0];
}

async function fetchAppStoreHTML(
  id: string,
  country: string,
): Promise<MediaShelfSummary> {
  const url = `https://apps.apple.com/${country}/app/id${id}`;
  const empty: MediaShelfSummary = {
    subtitle: null,
    iphoneScreenshotCount: null,
    ipadScreenshotCount: null,
    hasPreviewVideo: null,
  };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": DESKTOP_UA,
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return { ...empty, htmlParseError: `HTML fetch failed: ${res.status}` };
    }
    const html = await res.text();
    const blobMatch = html.match(
      /<script[^>]+id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/,
    );
    if (!blobMatch) {
      return { ...empty, htmlParseError: "Embedded app data blob not found." };
    }
    const parsed = JSON.parse(blobMatch[1]);
    const d0 = parsed?.data?.[0]?.data;
    if (!d0) {
      return { ...empty, htmlParseError: "Unexpected data blob shape." };
    }

    const subtitle: string | null = d0?.lockup?.subtitle ?? null;
    const phoneItems: unknown[] =
      d0?.shelfMapping?.product_media_phone_?.items ?? [];
    const padItems: unknown[] =
      d0?.shelfMapping?.product_media_pad_?.items ?? [];

    const hasScreenshot = (it: unknown): boolean =>
      !!(it && typeof it === "object" && (it as { screenshot?: unknown }).screenshot);
    const hasVideo = (it: unknown): boolean =>
      !!(it && typeof it === "object" && (it as { video?: unknown }).video);

    return {
      subtitle,
      iphoneScreenshotCount: phoneItems.filter(hasScreenshot).length,
      ipadScreenshotCount: padItems.filter(hasScreenshot).length,
      hasPreviewVideo: [...phoneItems, ...padItems].some(hasVideo),
    };
  } catch (err) {
    return {
      ...empty,
      htmlParseError: err instanceof Error ? err.message : "HTML parse error",
    };
  }
}

/**
 * Fetch the full `AppData` record for a given App Store app.
 *
 * Combines iTunes Lookup (structured) with App Store HTML scraping (for
 * the fields Lookup doesn't expose). Throws only if the app itself can't
 * be found; scrape failures degrade gracefully into `null` fields and
 * a warning inside `dataWarnings`.
 */
export async function fetchAppData(
  id: string,
  country: string,
): Promise<AppData> {
  const itunes = await fetchITunes(id, country);
  const media = await fetchAppStoreHTML(id, country);

  const dataWarnings: string[] = [];
  if (media.htmlParseError) {
    dataWarnings.push(
      `Could not scrape App Store page (${media.htmlParseError}). ` +
        `Subtitle and visual asset checks may be inaccurate.`,
    );
  }

  return {
    ...itunes,
    subtitle: media.subtitle,
    iphoneScreenshotCount: media.iphoneScreenshotCount,
    ipadScreenshotCount: media.ipadScreenshotCount,
    hasPreviewVideo: media.hasPreviewVideo,
    dataWarnings,
  };
}
