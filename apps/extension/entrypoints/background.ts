// ---------------------------------------------------------------------------
// MV3 service worker.
//
// The popup sends a `ScanRequest` and waits for a `ScanResponse`. The SW:
//   1. Resolves the app ID + country (from URL if needed).
//   2. Serves from chrome.storage.session if there's a fresh entry.
//   3. Otherwise calls fetchAppData (iTunes + HTML scrape), scores it,
//      estimates downloads, writes the result to session cache.
//   4. Replies once, asynchronously.
//
// Host permissions cover apps.apple.com + itunes.apple.com so these
// fetches run under the extension's own origin with no CORS headache.
//
// The SW can be torn down any time (30s idle / 5min busy). That's fine:
// it's stateless except for chrome.storage, and sendMessage re-wakes it.
// ---------------------------------------------------------------------------

import {
  parseAppleUrl,
  fetchAppData,
  scoreApp,
  estimateDownloads,
} from "@aso/core";
import { readCache, writeCache } from "../lib/cache";
import type { ScanRequest, ScanResponse, ScanResult } from "../lib/messages";

async function performScan(
  id: string,
  country: string,
  force: boolean,
): Promise<ScanResponse> {
  try {
    if (!force) {
      const cached = await readCache(id, country);
      if (cached) {
        return {
          ok: true,
          data: cached.data,
          fromCache: true,
          fetchedAt: cached.fetchedAt,
        };
      }
    }

    const app = await fetchAppData(id, country);
    const score = scoreApp(app);
    const estimate = estimateDownloads(app);
    const result: ScanResult = { app, score, estimate };
    const entry = await writeCache(id, country, result);

    return {
      ok: true,
      data: entry.data,
      fromCache: false,
      fetchedAt: entry.fetchedAt,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function handleRequest(req: ScanRequest): Promise<ScanResponse> {
  if (req.type === "scan") {
    const parsed = parseAppleUrl(req.url);
    if (!parsed) {
      return {
        ok: false,
        error:
          "This doesn't look like an App Store URL. Open a listing at apps.apple.com and try again.",
      };
    }
    return performScan(parsed.id, parsed.country, false);
  }
  return performScan(req.id, req.country, req.force ?? false);
}

export default defineBackground(() => {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    // Narrow the incoming value; sendMessage has `unknown` type at runtime.
    const req = message as ScanRequest;
    if (!req || (req.type !== "scan" && req.type !== "scan-id")) {
      sendResponse({ ok: false, error: "Unknown request" } as ScanResponse);
      return false;
    }

    // Return true to signal we'll call sendResponse asynchronously.
    handleRequest(req).then(sendResponse, (err) =>
      sendResponse({
        ok: false,
        error: err instanceof Error ? err.message : "Unknown error",
      } as ScanResponse),
    );
    return true;
  });
});
