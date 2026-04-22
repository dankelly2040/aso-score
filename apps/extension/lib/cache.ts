// ---------------------------------------------------------------------------
// Thin TTL cache over chrome.storage.session.
//
// Session storage is scoped to the browser session (cleared on restart),
// capped at 10 MB, and not synced — exactly what we want for scan
// results: fresh-ish, never stale across browser restarts, never leaked
// to a signed-in Google account.
//
// Apple's data changes slowly (version updates maybe weekly, ratings
// drift minute-by-minute in ways nobody audits live), so a 10-minute
// TTL keeps repeat clicks snappy without serving genuinely stale info.
// ---------------------------------------------------------------------------

import type { ScanResult } from "./messages";

const TTL_MS = 10 * 60 * 1000;

interface CacheEntry {
  data: ScanResult;
  fetchedAt: number;
}

function cacheKey(id: string, country: string): string {
  return `scan:${country}:${id}`;
}

export async function readCache(
  id: string,
  country: string,
): Promise<CacheEntry | null> {
  const key = cacheKey(id, country);
  const bag = await chrome.storage.session.get(key);
  const entry = bag[key] as CacheEntry | undefined;
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) return null;
  return entry;
}

export async function writeCache(
  id: string,
  country: string,
  data: ScanResult,
): Promise<CacheEntry> {
  const entry: CacheEntry = { data, fetchedAt: Date.now() };
  await chrome.storage.session.set({ [cacheKey(id, country)]: entry });
  return entry;
}

export async function clearCache(
  id: string,
  country: string,
): Promise<void> {
  await chrome.storage.session.remove(cacheKey(id, country));
}
