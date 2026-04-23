# ASO Score — Chrome Extension

An icon-click popup that grades any iOS App Store listing across six ASO
categories, powered by the same `@aso/core` engine as [the web app][web].

[web]: https://aso-score.expo.app

## How it works

1. User navigates to a listing at `apps.apple.com/*/app/*/id*`.
2. Clicks the ASO Score toolbar icon.
3. The popup reads the active tab URL, sends a `scan` message to the MV3
   service worker.
4. The service worker calls `fetchAppData` (iTunes Lookup + apps.apple.com
   HTML scrape) directly from its own origin — Apple's endpoints are in
   `host_permissions`, so CORS doesn't apply. Result is scored via
   `scoreApp`, augmented with `estimateDownloads`, cached in
   `chrome.storage.session` for 10 minutes, and returned to the popup.
5. "Open full report" deep-links to the web app with `?id=…&country=…`,
   which auto-scans on first paint.

All scoring, estimation, and URL parsing lives in `@aso/core` so the
extension and the web app can never drift apart.

## Local development

From the monorepo root:

```sh
pnpm install
pnpm ext:dev       # WXT dev server with HMR
pnpm ext:build     # production chrome-mv3 bundle → apps/extension/.output/
pnpm -C apps/extension zip   # packages a submittable .zip
```

Load the dev build in Chrome:

1. Visit `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Pick `apps/extension/.output/chrome-mv3`

During dev, override the "Open full report" target so it points at your
local Expo server instead of prod:

```js
// In the extension's DevTools console (right-click popup → Inspect)
chrome.storage.local.set({ webAppUrl: "http://localhost:8081" });
```

## Regenerating icons

A single `assets/icon.svg` is the source of truth. When it changes, run:

```sh
pnpm -C apps/extension make:icons
```

This regenerates `public/icon/{16,32,48,128}.png` via `@resvg/resvg-js`.

## Manual test checklist

Before submitting to the Chrome Web Store, verify:

- [ ] Idle state: click icon on `google.com` → "Open an App Store listing"
- [ ] Happy path: click on a real app page → score ring + category bars +
      download estimate + "Open full report" button
- [ ] Deep-link: click "Open full report" → new tab lands on
      `aso-score.expo.app/?id=X&country=Y` and auto-scans
- [ ] Cache hit: click icon twice on the same listing within 10 min →
      second render shows "Cached · Ns ago"
- [ ] Force refresh: click the ↻ button → "Fresh · 0s ago"
- [ ] Non-software ID (music album): should show
      "That ID belongs to a collection, not an iOS app."
- [ ] Dark mode: OS dark → popup flips palette

## Privacy

The extension reads only the active tab's URL (via `activeTab`) and only
on user click. It fetches from Apple's servers, scores locally, and
caches results in `chrome.storage.session`. No analytics, no backend,
no user data leaves the device except the app ID + country code that get
passed in a query string when the user clicks "Open full report". See
[`PRIVACY.md`](./PRIVACY.md) for the listing-page policy.
