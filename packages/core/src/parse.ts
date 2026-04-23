// ---------------------------------------------------------------------------
// App Store URL parsing.
//
// Used by:
//   - Web app: the search box accepts both raw IDs and full URLs.
//   - Extension: service worker parses the active tab's URL before scanning.
// ---------------------------------------------------------------------------

export interface ParsedAppleUrl {
  /** Numeric track/app ID as a string (preserves leading zeros, though Apple never uses them). */
  id: string;
  /** Two-letter country code, lowercase. Defaults to "us" when none is present. */
  country: string;
}

/**
 * Parse an App Store URL or raw numeric app ID.
 *
 * Accepts:
 *   - https://apps.apple.com/us/app/partiful/id1662982304
 *   - apps.apple.com/gb/app/.../id1662982304?mt=8
 *   - 1662982304
 *
 * Returns `null` for anything else (empty, bare URL without `/id`, etc.)
 * so callers can show a friendly error instead of throwing.
 */
export function parseAppleUrl(input: string): ParsedAppleUrl | null {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/id(\d+)/);
  if (urlMatch) return { id: urlMatch[1], country: extractCountry(trimmed) };
  if (/^\d+$/.test(trimmed)) return { id: trimmed, country: "us" };
  return null;
}

function extractCountry(url: string): string {
  const m = url.match(/apps\.apple\.com\/([a-z]{2})\//i);
  return m ? m[1].toLowerCase() : "us";
}
