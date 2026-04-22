// ---------------------------------------------------------------------------
// Frozen AppData fixture for Partiful, captured live from the App Store.
// Used by the scoring and estimate tests to guard against accidental
// algorithm drift — any score delta shows up as a snapshot diff in PR.
//
// Dates are anchored to a fixed point (see the matching vi.setSystemTime
// call in scoring tests) so "days since update" checks don't go wobbly
// with the wall clock.
// ---------------------------------------------------------------------------

import type { AppData } from "../../src/types";

export const PARTIFUL_FIXTURE: AppData = {
  trackName: "Partiful",
  artistName: "Partiful, Inc.",
  description:
    "Partiful is the easiest way to throw any kind of party.\n\nPlan a birthday, potluck, game night, holiday gathering, or a themed rager — all in minutes.\n\n• Beautiful invites with RSVPs and reminders\n• Free to use, with polls, photos, and group chat\n• Private guest lists, no Facebook, no ads\n• Download now and try it free.\n\nJOIN the waitlist, start hosting, and get the party going.",
  averageUserRating: 4.8,
  userRatingCount: 48_203,
  currentVersionReleaseDate: "2026-03-02T10:00:00Z",
  releaseDate: "2020-11-10T07:00:00Z",
  releaseNotes:
    "This update polishes invite animations, fixes two edge-case crashes on iPad, and ships a faster photo gallery.",
  languageCodesISO2A: ["EN", "ES", "FR", "DE", "JA", "PT", "IT"],
  primaryGenreName: "Social Networking",
  artworkUrl100: "https://example.com/icon-100.png",
  artworkUrl512: "https://example.com/icon-512.png",
  trackId: 1479433002,
  subtitle: "Plan parties people show up to",
  iphoneScreenshotCount: 7,
  ipadScreenshotCount: 4,
  hasPreviewVideo: true,
  dataWarnings: [],
};

/**
 * A deliberately weak listing — short title, no subtitle, no video, low
 * ratings count — so we can confirm the scorer produces a proportional
 * hit rather than silently rounding to a healthy-looking number.
 */
export const WEAK_FIXTURE: AppData = {
  trackName: "Todo App | Best Task Manager | Get Things Done Pro 2026",
  artistName: "Some Dev",
  description:
    "The ultimate task manager. Manage tasks. Stay productive. Built with love.",
  averageUserRating: 3.2,
  userRatingCount: 48,
  currentVersionReleaseDate: "2025-09-01T00:00:00Z",
  releaseDate: "2024-06-01T00:00:00Z",
  releaseNotes: "Bug fixes and improvements.",
  languageCodesISO2A: ["EN"],
  primaryGenreName: "Productivity",
  artworkUrl100: undefined,
  artworkUrl512: undefined,
  trackId: 9999999999,
  subtitle: null,
  iphoneScreenshotCount: 2,
  ipadScreenshotCount: 0,
  hasPreviewVideo: false,
  dataWarnings: [],
};
