// ---------------------------------------------------------------------------
// URL parser tests.
//
// This function is the only input validator in the whole pipeline — both
// the web search box and the Chrome extension's service worker feed it
// arbitrary user strings. A regression here means the score screen
// silently never loads, so we exercise a lot of edge cases.
// ---------------------------------------------------------------------------

import { describe, expect, it } from "vitest";
import { parseAppleUrl } from "../src/parse";

describe("parseAppleUrl", () => {
  it("parses a full apps.apple.com URL", () => {
    expect(
      parseAppleUrl("https://apps.apple.com/us/app/partiful/id1479433002"),
    ).toEqual({ id: "1479433002", country: "us" });
  });

  it("parses URLs without protocol", () => {
    expect(
      parseAppleUrl("apps.apple.com/gb/app/some-app/id999999?mt=8"),
    ).toEqual({ id: "999999", country: "gb" });
  });

  it("trims whitespace", () => {
    expect(
      parseAppleUrl("  https://apps.apple.com/us/app/partiful/id1479433002  "),
    ).toEqual({ id: "1479433002", country: "us" });
  });

  it("accepts a bare numeric ID and defaults country to us", () => {
    expect(parseAppleUrl("1479433002")).toEqual({
      id: "1479433002",
      country: "us",
    });
  });

  it("lowercases the country code", () => {
    expect(
      parseAppleUrl("https://apps.apple.com/JP/app/foo/id12345"),
    ).toEqual({ id: "12345", country: "jp" });
  });

  it("returns null for random strings", () => {
    expect(parseAppleUrl("hello")).toBeNull();
    expect(parseAppleUrl("")).toBeNull();
    expect(parseAppleUrl("https://example.com")).toBeNull();
  });

  it("returns null for a URL missing /id", () => {
    expect(parseAppleUrl("https://apps.apple.com/us/app/partiful")).toBeNull();
  });
});
