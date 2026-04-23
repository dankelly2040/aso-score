# Privacy Policy — ASO Score

_Last updated: 2026-04-22_

## Summary

ASO Score does not collect, transmit, sell, or share any personal
information. Everything runs locally in your browser.

## What the extension accesses

When you click the ASO Score toolbar icon on an App Store listing page,
the extension:

1. **Reads the current tab's URL** (via the `activeTab` permission, which
   requires your click to unlock). This is used only to extract the
   numeric app ID and two-letter country code embedded in the URL.
2. **Fetches public data from Apple's servers** — specifically
   `itunes.apple.com/lookup` (the public iTunes Search API) and the HTML
   of the listing page at `apps.apple.com` — to retrieve the same
   information any visitor to that page would see (title, subtitle,
   screenshots, ratings, release date, etc.).
3. **Scores the listing locally** inside the extension's service worker.
   No data leaves your device during scoring.
4. **Caches the result** in `chrome.storage.session` for ten minutes so
   a repeat click on the same listing is instant. Session storage is
   cleared automatically when you close the browser.

## What we do not do

- We do not run content scripts or read page contents other than the
  public listing HTML you're already viewing.
- We do not track browsing activity across sites.
- We do not send telemetry, analytics, crash reports, or usage data
  anywhere.
- We do not have a backend. There is no account, no login, no user ID.
- We do not sell or share data with third parties. There are no third
  parties.

## What happens when you click "Open full report"

The "Open full report" button opens a new tab at
`https://aso-score.expo.app/?id=<appId>&country=<cc>` so you can see the
full breakdown in the companion web app. Only those two values — the
numeric app ID and two-letter country code, both already part of the
public App Store URL — are passed in the query string. The web app then
makes the same public Apple requests the extension would have, scores
the result, and displays it. No account or identifier is attached.

## Permissions explained

- `activeTab` — lets the popup read the URL of the tab you clicked from,
  and only while that popup is open. The extension cannot read other
  tabs or background tabs.
- `storage` — used only for the 10-minute session cache described above
  and for an optional user-set override of the "Open full report" URL
  (used by developers running the companion web app locally).
- `host_permissions` for `https://apps.apple.com/*` and
  `https://itunes.apple.com/*` — lets the service worker fetch public
  Apple data without being blocked by CORS. The extension makes no
  requests to any other domain.

## Contact

Questions about this policy? Email **dan@expo.io** or open an issue at
the project's GitHub repository.
