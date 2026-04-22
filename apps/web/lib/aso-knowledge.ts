// ASO knowledge bundled for prompt grounding.
// Sourced (MIT-licensed) from: https://github.com/Eronred/aso-skills
// Specifically: aso-audit, metadata-optimization, screenshot-optimization,
// keyword-research, localization, rating-prompt-strategy.
// Condensed to fit prompt budgets while preserving the actionable guidance.

export const ASO_KNOWLEDGE = `
# ASO Reference Knowledge

Source: Eronred/aso-skills (MIT, https://github.com/Eronred/aso-skills)

## Audit weighting (relative importance)
- Title: 20%  Subtitle: 15%  Keyword Field: 15%  Description: 5% iOS / 15% Android
- Screenshots: 15%  Preview Video: 5%  Ratings & Reviews: 15%  Icon: 5%
- Keyword Rankings: 10%  Conversion Signals: 5%

## Title (iOS, 30 chars)
Formulas that work:
- [Brand] - [Primary Keyword] (e.g., "Calm - Sleep & Meditation")
- [Brand]: [Benefit Phrase]   (e.g., "Duolingo: Language Lessons")
- [Primary Keyword] [Brand]   (e.g., "Headspace: Mindful Meditation")
Rules:
- Lead with brand if well-known; lead with keyword if not.
- Use the full 30 characters. Avoid ™/®.
- Never keyword-stuff. Title must read naturally.
- When recommending, always provide 3 options with char counts.

## Subtitle (iOS, 30 chars)
- Never repeat keywords from the title.
- Benefits over features.
- Use the full 30 characters.

## Keyword Field (iOS, 100 chars)
- Comma-separated, NO spaces after commas.
- Never repeat title/subtitle words.
- Singular forms only (Apple indexes both).
- Do NOT include brand name, category name, "app", or "free".
- Do NOT include competitor brand names (policy violation).
- Prioritize by: volume × relevance.

## Description
Structure (iOS and Android):
1. Hook (first 3 lines) — the only copy most visitors read. Lead with benefit, not brand.
2. Social proof — awards, press, user count, rating.
3. 4-6 feature bullets with BENEFITS, not just features.
4. How it works — simple 3-step.
5. Testimonial/review quote.
6. CTA — clear call to download.
Rules:
- First 170 characters critical (above "more" fold).
- Use line breaks, bullets, emoji for scannability.
- Android: natural keyword density 2-3% throughout. No stuffing.
- Avoid weak openers like "Welcome to...".

## Screenshots
Users spend 3-6 seconds on a product page. First 3 screenshots = 80% of conversion decision.
Slot strategy:
- Slot 1 (Hook): benefit headline + key UI. Avoid welcome/login/settings screens.
- Slots 2-3: core value, benefit-driven captions.
- Slots 4-7: feature showcase — [Benefit Headline] + [Feature UI] + [Supporting Detail].
- Slots 8-9: trust & differentiation — awards, press, ratings, comparison.
- Slot 10: CTA — "Start free trial", "Join Xm users".
Text overlays: 4-6 word benefit headlines, min 60px, high contrast, consistent font.
Avoid: busy backgrounds, feature names as headlines, small text, mixed fonts.

## App Preview Video
- Hook in first 3 seconds.
- 15-30 seconds optimal.
- No sound dependency — use captions.
- Show real usage, not marketing fluff.
- End with CTA.

## Ratings & Reviews
- Ratings are both a ranking signal AND a conversion factor in search.
- iOS: resets per version; SKStoreReviewRequest max 3x per 365 days.
- Android: permanent and cumulative; Play In-App Review API throttled by Google.
Core rule: only prompt users who have experienced value.
Session-based criteria to prompt:
- Sessions >= 3, days since install >= 3
- Has completed activation event
- No crash in last session
- No negative signal (error, cancellation) in current session
- Not already rated this version
Pre-prompt survey recommended:
- "Are you enjoying [App Name]?" → Yes routes to native prompt; "Not really" routes to feedback form.
- Expected improvement: +0.3–0.8 stars.
Good prompt moments: after workout/task complete, after level win, after successful purchase.
Bad prompt moments: after crashes, errors, failed checkouts, skipped sessions.

## Keyword Research
- Apple Search autocomplete + competitor keyword gap + category analysis + synonyms.
- Opportunity = (Volume × 0.4) + ((100 - Difficulty) × 0.3) + (Relevance × 0.3)
- Group into Primary (3-5, in title/subtitle), Secondary (5-10, subtitle/keyword field),
  Long-tail (10-20, keyword field fill), Aspirational (3-5, long-term).
- Don't repeat keywords across title/subtitle/keyword field.
- Update quarterly, track weekly.

## Localization
- Tier 1 markets (highest ROI): US, UK, Germany, Japan, France, South Korea,
  China (complex, needs ICP), Brazil, Canada, Australia.
- Tier 2: Spain, Italy, Netherlands, Sweden, Russia, Mexico, India, Indonesia, Turkey, Saudi Arabia.
- CRITICAL: keywords are NOT translations. Run fresh keyword research per market.
  Example: "budget tracker" (EN) → "Haushaltsbuch" (DE, lit. household book),
  "家計簿" (JP, household ledger), "control de gastos" (ES, expense control).
- Localize all metadata, screenshot text overlays, preview video.
- Cultural adaptation: currency, date/number formats, color associations,
  imagery, tone (formal vs informal), local press/social proof, pricing PPP.

## Common mistakes to flag
- Repeating keywords across title, subtitle, and keyword field.
- Plural forms in keyword field (wastes characters).
- Spaces after commas in keyword field.
- Brand name in keyword field.
- Keyword stuffing that hurts readability.
- Not using all available characters.
- Description starting with "Welcome to..."
- "Bug fixes and improvements" as release notes.
- Reusing iPhone screenshots on iPad listing.
- Prompting for rating after errors or crashes.
`;
