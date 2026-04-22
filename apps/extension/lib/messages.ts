// ---------------------------------------------------------------------------
// Popup ↔ service worker message contract.
//
// Kept in one file so both ends import the same types. MV3 service workers
// can't share runtime state with the popup, so every popup open starts
// from scratch and talks to the SW via chrome.runtime.sendMessage.
// ---------------------------------------------------------------------------

import type {
  AppData,
  DownloadEstimate,
  ScoreResult,
} from "@aso/core";

export interface ScanResult {
  app: AppData;
  score: ScoreResult;
  estimate: DownloadEstimate | null;
}

export type ScanRequest =
  /** Parse the URL, look up ID + country, then fetch and score. */
  | { type: "scan"; url: string }
  /** Fetch and score for a specific ID + country (used by "refresh"). */
  | { type: "scan-id"; id: string; country: string; force?: boolean };

export type ScanResponse =
  | {
      ok: true;
      data: ScanResult;
      fromCache: boolean;
      /** Epoch ms when the underlying data was fetched. */
      fetchedAt: number;
    }
  | { ok: false; error: string };
