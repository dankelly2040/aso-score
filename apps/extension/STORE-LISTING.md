# Chrome Web Store — Listing Copy

Working copy of the fields required by the Web Store submission form.
Keep this file in sync with the live listing so the next update is a
paste, not a rewrite.

## Name

```
ASO Score — App Store Audit
```

(29 characters, under the 45-char limit.)

## Short description

_Chrome Web Store field: "Summary" — max 132 characters._

```
Grade any iOS App Store listing across 6 ASO categories — title, subtitle, screenshots, ratings, freshness — in one click.
```

(122 characters.)

## Category

```
Developer Tools
```

Secondary candidate: _Productivity_ (if Developer Tools is rejected by
review as too narrow).

## Language

```
English (en)
```

## Detailed description

_Max 16,000 characters. The form renders plain text with line breaks —
no Markdown._

```
ASO Score gives you an instant, unbiased audit of any iOS App Store
listing. Click the toolbar icon on any apps.apple.com page and get a
0-100 score broken down across the six signals that drive discovery
and conversion on the App Store:

• Title & Subtitle — length, keyword density, separator hygiene
• Visuals — screenshot count, app preview video presence
• Social Proof — rating count, average rating, review volume
• Freshness — time since last update, release-notes quality
• Conversion Signals — category fit, age rating coherence
• Downloads (estimated) — a proxy derived from rating volume and
  listing age, in the same ballpark as paid tools like AppFigures or
  Sensor Tower for the top of the funnel

Why it exists
—————————————
Most ASO tools require an account, a paid plan, and a dashboard.
ASO Score is free, local-first, and one click. No signup, no tracking,
no data leaves your browser. The scoring engine is open source — you
can read exactly how each category is weighted.

How it works
————————————
• Reads only the tab's URL (activeTab), only when you click the icon
• Fetches public data directly from Apple's servers (iTunes Lookup +
  the listing HTML you're already viewing)
• Scores the listing locally in the extension's service worker
• Caches the result for 10 minutes so repeat clicks are instant
• "Open full report" deep-links to the companion web app for the full
  breakdown

Who it's for
————————————
• Indie developers auditing their own listing before a release
• Growth/ASO consultants comparing a client's page to competitors
• Product managers checking that a launch listing is actually shipped
  with screenshots, a subtitle, and a sane rating count
• Anyone curious why one app ranks and another doesn't

Privacy
———————
We do not collect, transmit, sell, or share any data. No analytics,
no backend, no account. The only bytes that leave your browser go to
Apple's own servers — the same requests your browser would make
visiting the page. See the full policy:
https://github.com/<owner>/aso-score/blob/main/apps/extension/PRIVACY.md

Companion web app
—————————————————
The full report opens at https://aso-score.expo.app — the same scoring
engine, viewable without installing anything.

Open source
———————————
Source code: https://github.com/<owner>/aso-score
Bug reports and feature requests welcome.
```

(Replace `<owner>` with the actual GitHub org/user before submitting.)

## Single-purpose description

_Chrome Web Store requires a one-sentence explanation of the
extension's single purpose. This is a separate field from "Summary"._

```
Grade an iOS App Store listing the user is actively viewing and show a 0-100 breakdown across six ASO categories.
```

## Permission justifications

_The reviewer asks for a justification for each permission. Keep each
under 1,000 characters._

### `activeTab`

```
Used only when the user clicks the toolbar icon on an apps.apple.com
page. The extension reads the URL of that tab to extract the numeric
app ID and country code embedded in the URL. It does not read the
tab's DOM. No other tabs are accessed.
```

### `storage`

```
Used to cache the scored result for ten minutes in
chrome.storage.session so a second click on the same listing is
instant, and to optionally remember a user-set override of the "Open
full report" target (used by developers running the companion web
app locally). Nothing personally identifying is stored.
```

### Host permission: `https://apps.apple.com/*`

```
The extension's service worker fetches the public HTML of the App
Store listing the user is viewing, to extract listing data (title,
subtitle, screenshot URLs) that is not exposed by the iTunes Lookup
API. Without this host permission the fetch would be blocked by CORS.
```

### Host permission: `https://itunes.apple.com/*`

```
The extension calls Apple's public iTunes Lookup endpoint
(itunes.apple.com/lookup) to retrieve the structured metadata (rating
count, release date, genres, age rating) used to compute the ASO
score. Without this host permission the fetch would be blocked by
CORS.
```

### Remote code

```
No. All JavaScript shipped with the extension is bundled at build
time. The extension does not eval, import, or inject any code fetched
at runtime.
```

### Data collection & use (required Chrome Web Store disclosure)

- Personally identifiable information: **none**
- Health information: **none**
- Financial & payment information: **none**
- Authentication information: **none**
- Personal communications: **none**
- Location: **none**
- Web history: **none** (we read only the URL of the tab you clicked)
- User activity: **none**
- Website content: **none** (we fetch public Apple pages, not the
  user's other pages)

Certifications:
- [x] I do not sell or transfer user data to third parties outside of
      the approved use cases.
- [x] I do not use or transfer user data for purposes unrelated to the
      item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness
      or for lending purposes.

## Promotional images (manual — not in repo)

Required before submission:
- **Small promo tile** — 440 × 280 PNG
- **Marquee promo tile** (optional) — 1400 × 560 PNG
- **Screenshots** — at least one at 1280 × 800 or 640 × 400 PNG. Plan:
  1. Popup on a high-scoring app (screenshot of the score ring + bars)
  2. Popup on a low-scoring app (shows the differentiator)
  3. "Open full report" web view

Keep unversioned drafts in `apps/extension/store-assets/` (gitignored).

## Submission checklist

- [ ] `pnpm ext:build` completes clean
- [ ] `pnpm -C apps/extension zip` produces `.output/*.zip`
- [ ] Manual test checklist in README.md passes on a clean Chrome profile
- [ ] Privacy policy URL is live (link to PRIVACY.md on GitHub is fine)
- [ ] Promo tile 440×280 ready
- [ ] At least one 1280×800 screenshot ready
- [ ] Single-purpose description pasted into the form
- [ ] Each permission has a justification pasted in
- [ ] Data-collection disclosure completed (all "none")
- [ ] Version in `wxt.config.ts` bumped if this is an update
