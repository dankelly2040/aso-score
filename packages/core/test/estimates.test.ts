// ---------------------------------------------------------------------------
// Download estimate tests.
// ---------------------------------------------------------------------------

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { estimateDownloads, formatDownloadCount } from "../src/estimates";
import { PARTIFUL_FIXTURE } from "./fixtures/partiful";

beforeAll(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-04-22T12:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

describe("estimateDownloads", () => {
  it("returns a mid-tier estimate for Partiful", () => {
    const estimate = estimateDownloads(PARTIFUL_FIXTURE);
    expect(estimate).not.toBeNull();
    // 48,203 ratings × 200 (mid bucket) ÷ ~65 months ≈ ~148k/month.
    expect(estimate!.lifetime).toBe(48_203 * 200);
    expect(estimate!.monthly).toBeGreaterThan(100_000);
    expect(estimate!.confidence).toBe("high");
    expect(estimate!.method).toContain("200");
  });

  it("uses the small-app ratio (75) under 1k ratings", () => {
    const estimate = estimateDownloads({
      ...PARTIFUL_FIXTURE,
      userRatingCount: 500,
    });
    expect(estimate!.lifetime).toBe(500 * 75);
  });

  it("uses the large-app ratio (600) over 100k ratings", () => {
    const estimate = estimateDownloads({
      ...PARTIFUL_FIXTURE,
      userRatingCount: 250_000,
    });
    expect(estimate!.lifetime).toBe(250_000 * 600);
  });

  it("returns null when the input signal is too weak", () => {
    expect(
      estimateDownloads({ ...PARTIFUL_FIXTURE, userRatingCount: 3 }),
    ).toBeNull();
    expect(
      estimateDownloads({ ...PARTIFUL_FIXTURE, releaseDate: undefined }),
    ).toBeNull();
  });

  it("clamps months since release to at least 1", () => {
    const estimate = estimateDownloads({
      ...PARTIFUL_FIXTURE,
      userRatingCount: 120,
      releaseDate: "2026-04-20T00:00:00Z", // 2 days ago
    });
    expect(estimate!.monthly).toBe(estimate!.lifetime); // division by 1
  });

  it("assigns 'low' confidence to small, recent apps", () => {
    const estimate = estimateDownloads({
      ...PARTIFUL_FIXTURE,
      userRatingCount: 150,
      releaseDate: "2026-03-01T00:00:00Z",
    });
    expect(estimate!.confidence).toBe("low");
  });
});

describe("formatDownloadCount", () => {
  it("formats millions with one decimal under 10M", () => {
    expect(formatDownloadCount(1_200_000)).toBe("1.2M");
  });

  it("formats millions without decimals at 10M+", () => {
    expect(formatDownloadCount(12_300_000)).toBe("12M");
  });

  it("formats thousands with one decimal under 10K", () => {
    expect(formatDownloadCount(3_400)).toBe("3.4K");
  });

  it("formats thousands without decimals at 10K+", () => {
    expect(formatDownloadCount(48_000)).toBe("48K");
  });

  it("returns the raw locale-formatted count under 1000", () => {
    expect(formatDownloadCount(920)).toBe("920");
  });
});
