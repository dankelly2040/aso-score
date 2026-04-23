// ---------------------------------------------------------------------------
// fetchAppData tests — mock global fetch so these run without network.
//
// The behavior that matters most here: iTunes Lookup sometimes returns a
// non-software row even when the query says `entity=software`. That's
// how we discovered, late in v1, that the web app had been silently
// grading a music album as an app. The guard in fetchAppData is what
// this file exercises.
// ---------------------------------------------------------------------------

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { fetchAppData } from "../src/fetch";

const APP_JSON = {
  resultCount: 1,
  results: [
    {
      wrapperType: "software",
      trackName: "Partiful",
      artistName: "Partiful, Inc.",
      description: "Plan parties.",
      trackId: 1662982304,
    },
  ],
};

const ALBUM_JSON = {
  resultCount: 1,
  results: [
    {
      wrapperType: "collection",
      collectionType: "Album",
      artistName: "regik",
      collectionName: "Berimbau - Single",
    },
  ],
};

function mockFetchSequence(responses: { url: RegExp; body: unknown | string }[]) {
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const spec of responses) {
      if (spec.url.test(url)) {
        const body =
          typeof spec.body === "string" ? spec.body : JSON.stringify(spec.body);
        return new Response(body, { status: 200 });
      }
    }
    return new Response("", { status: 404 });
  }) as typeof fetch;
}

describe("fetchAppData", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("rejects music album IDs with a helpful error", async () => {
    mockFetchSequence([
      { url: /itunes\.apple\.com\/lookup/, body: ALBUM_JSON },
    ]);
    await expect(fetchAppData("1479433002", "us")).rejects.toThrow(
      /collection, not an iOS app/,
    );
  });

  it("returns AppData when the lookup hit is software", async () => {
    mockFetchSequence([
      { url: /itunes\.apple\.com\/lookup/, body: APP_JSON },
      // Return an HTML page without the data blob so the scraper falls
      // back to null fields (not an error) — that's the common case
      // when Apple serves a regional/mobile page variant.
      { url: /apps\.apple\.com/, body: "<html><body></body></html>" },
    ]);
    const app = await fetchAppData("1662982304", "us");
    expect(app.trackName).toBe("Partiful");
    expect(app.subtitle).toBeNull();
    expect(app.iphoneScreenshotCount).toBeNull();
    expect(app.dataWarnings.length).toBe(1);
  });

  it("surfaces iTunes failures as thrown errors", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("", { status: 503 }),
    ) as typeof fetch;
    await expect(fetchAppData("1662982304", "us")).rejects.toThrow(
      /iTunes lookup failed/,
    );
  });
});
