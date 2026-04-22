// ---------------------------------------------------------------------------
// Scoring tests.
//
// Snapshot-based so the whole 17-check output is diffable on PR. Clock
// is pinned to 2026-04-22 so "days since update" checks are stable.
// ---------------------------------------------------------------------------

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { CATEGORIES, scoreApp } from "../src/score";
import { PARTIFUL_FIXTURE, WEAK_FIXTURE } from "./fixtures/partiful";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-22T12:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("scoreApp", () => {
  it("grades the strong Partiful fixture in the 80+ range", () => {
    const result = scoreApp(PARTIFUL_FIXTURE);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.categoryScores.title.pct).toBeGreaterThanOrEqual(80);
    expect(result.categoryScores.visuals.pct).toBeGreaterThanOrEqual(80);
  });

  it("matches the full Partiful snapshot", () => {
    expect(scoreApp(PARTIFUL_FIXTURE)).toMatchSnapshot();
  });

  it("grades the weak fixture under 50", () => {
    const result = scoreApp(WEAK_FIXTURE);
    expect(result.score).toBeLessThan(50);
  });

  it("emits one Check per category weight slot", () => {
    const result = scoreApp(PARTIFUL_FIXTURE);
    for (const cat of Object.keys(CATEGORIES)) {
      const checksInCat = result.checks.filter((c) => c.cat === cat);
      expect(checksInCat.length).toBeGreaterThan(0);
    }
  });

  it("marks scrape-derived fields as unknown when null", () => {
    const missingScrape = {
      ...PARTIFUL_FIXTURE,
      subtitle: null,
      iphoneScreenshotCount: null,
      ipadScreenshotCount: null,
      hasPreviewVideo: null,
    };
    const result = scoreApp(missingScrape);
    const unknowns = result.checks.filter((c) => c.status === "unknown");
    // Four scrape-backed checks must all be unknown, not failed.
    expect(unknowns.map((c) => c.key).sort()).toEqual([
      "ipad-screenshots",
      "screenshot-count",
      "subtitle-present",
      "video-preview",
    ]);
  });

  it("excludes unknown checks from category totals", () => {
    const missingScrape = {
      ...PARTIFUL_FIXTURE,
      subtitle: null,
      iphoneScreenshotCount: null,
      ipadScreenshotCount: null,
      hasPreviewVideo: null,
    };
    const result = scoreApp(missingScrape);
    // visuals has 3 unknown checks out of 4 (only the icon check remains),
    // so its total weight should equal just the icon check's weight (5).
    expect(result.categoryScores.visuals.total).toBe(5);
  });
});
