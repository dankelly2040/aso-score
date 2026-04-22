# ASO Score

Grade any iOS App Store listing across 6 ASO (App Store Optimization) categories and get an AI-written, source-grounded action plan.

**Live demo:** [aso-score.expo.app](https://aso-score.expo.app)

Built with [Expo Router](https://docs.expo.dev/router/introduction/) (web), deployed on [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/), and powered by the [Anthropic API](https://docs.anthropic.com/).

---

## What it does

Paste an App Store URL (or raw numeric App ID). ASO Score will:

1. Fetch the app's iTunes Lookup data and scrape the public App Store HTML for the fields iTunes doesn't expose (subtitle, screenshot counts, preview video).
2. Run 17 weighted checks across 6 categories.
3. Produce a **0–100 score** with per-category breakdowns and specific fix suggestions.
4. Optionally generate a prioritized **AI action plan** grounded in the [Eronred/aso-skills](https://github.com/Eronred/aso-skills) reference and the [Adjust ASO guide](https://www.adjust.com/resources/guides/app-store-optimization/).

### Scoring categories and weights

| Category             | Weight | What it checks                                                  |
| -------------------- | ------ | --------------------------------------------------------------- |
| Title & subtitle     | 20%    | Character usage, stuffing, subtitle presence & length           |
| Description          | 20%    | Length, hook, formatting, CTA                                   |
| Visual assets        | 25%    | Icon, iPhone screenshots, iPad screenshots, preview video       |
| Social proof         | 15%    | Average rating, rating volume                                   |
| Freshness & trust    | 10%    | Last update recency, release notes quality                      |
| Localization         | 10%    | Number of supported languages                                   |

Checks that can't be determined (e.g. the App Store page scrape fails) return an `unknown` status and are **excluded from the denominator** so they don't unfairly tank the score.

---

## Architecture

```
app/
  _layout.tsx              Root Stack (headers hidden)
  index.tsx                Screen that renders the DOM component
  api/
    fetch-app+api.ts       GET /api/fetch-app  — iTunes lookup + HTML scrape
    generate-plan+api.ts   POST /api/generate-plan — Anthropic proxy

components/
  ASOScoreDOM.tsx          The full UI ("use dom" component)

lib/
  aso-knowledge.ts         Bundled MIT-licensed ASO reference
                           used to ground AI recommendations
```

### Why DOM components?

The main UI is a [`"use dom"`](https://docs.expo.dev/guides/dom-components/) component, which lets us author it as pure React web code while keeping it embeddable in any Expo app. Everything renders in a WebView / iframe and calls the Expo Router API routes on the same origin.

### Why scrape the App Store HTML?

iTunes Lookup API returns incomplete data for many modern apps — `screenshotUrls`, `ipadScreenshotUrls`, and `previewVideoUrl` are often empty even when the listing clearly has them. We scrape the `<script id="serialized-server-data">` JSON blob from the public App Store page to get the canonical values for:

- `subtitle` (from `d0.lockup.subtitle`)
- `iphoneScreenshotCount` (from `d0.shelfMapping.product_media_phone_.items[]`)
- `ipadScreenshotCount` (from `d0.shelfMapping.product_media_pad_.items[]`)
- `hasPreviewVideo` (any item with `video` kind)

If the scrape fails, those checks fall back to `unknown` rather than scoring zero.

---

## Local development

```bash
# install deps
npm install

# start the dev server (web)
npx expo start --web
```

To test the `/api/generate-plan` route locally you'll need an Anthropic API key:

```bash
# .env.local (ignored by git)
ANTHROPIC_API_KEY=sk-ant-...
```

The key is read in `app/api/generate-plan+api.ts` via `process.env.ANTHROPIC_API_KEY`.

---

## Deploying to EAS Hosting

```bash
# build the web bundle
npx expo export -p web

# deploy to production (injects env vars from the "production" environment)
npx eas-cli@latest deploy --prod --environment production --non-interactive
```

### Setting the Anthropic API key on EAS

```bash
npx eas-cli@latest env:create \
  --variable-name ANTHROPIC_API_KEY \
  --variable-value sk-ant-... \
  --variable-environment production \
  --visibility sensitive \
  --non-interactive
```

> ⚠️ Use `--visibility sensitive` (available at Worker runtime). `secret` variables are build-time only and will not be readable from the deployed API route.

---

## Credits & licenses

- **ASO reference knowledge** is condensed from [Eronred/aso-skills](https://github.com/Eronred/aso-skills) (MIT-licensed) and the [Adjust App Store Optimization guide](https://www.adjust.com/resources/guides/app-store-optimization/). Both are cited inline in AI-generated plans.
- **Icons** from [lucide-react](https://github.com/lucide-icons/lucide) (ISC).
- **Font** is [Inter](https://rsms.me/inter/) (SIL Open Font License).
- **Framework**: [Expo](https://expo.dev/) & [Expo Router](https://docs.expo.dev/router/introduction/).
- **AI model**: [Claude](https://www.anthropic.com/claude) via the Anthropic Messages API.

## License

[MIT](./LICENSE) — do what you want, no warranty.

## Contributing

PRs welcome. A few obvious directions if you want to pick something up:

- **More accurate screenshot detection** for edge cases (some regions/apps return a different shelf structure).
- **Additional checks** — promotional text, in-app purchase copy, app size, crash rate signals.
- **International App Store support** beyond the country code in the URL.
- **Caching** — iTunes + HTML scrape results could be short-lived cached on EAS Hosting.

Open an issue first if you're planning something bigger than a minor fix.
