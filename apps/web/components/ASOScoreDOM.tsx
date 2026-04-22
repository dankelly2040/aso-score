"use dom";

import { useState, useEffect } from "react";

function GithubIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 .5C5.73.5.66 5.57.66 11.85c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55 0-.27-.01-.98-.02-1.93-3.16.69-3.82-1.52-3.82-1.52-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.62 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.46.11-3.04 0 0 .95-.3 3.12 1.17.9-.25 1.87-.38 2.83-.38s1.93.13 2.83.38c2.16-1.47 3.11-1.17 3.11-1.17.62 1.58.23 2.75.11 3.04.73.8 1.17 1.82 1.17 3.06 0 4.37-2.66 5.33-5.19 5.61.41.35.77 1.05.77 2.11 0 1.52-.01 2.75-.01 3.13 0 .3.2.66.79.55 4.51-1.5 7.76-5.75 7.76-10.77C23.34 5.57 18.27.5 12 .5z" />
    </svg>
  );
}

function SearchIcon({ size = 16, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function SparklesIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3Z" />
    </svg>
  );
}

function LoaderIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const CATEGORIES: Record<string, { label: string; weight: number }> = {
  title: { label: "Title & subtitle", weight: 20 },
  description: { label: "Description", weight: 20 },
  visuals: { label: "Visual assets", weight: 25 },
  social: { label: "Social proof", weight: 15 },
  freshness: { label: "Freshness & trust", weight: 10 },
  localization: { label: "Localization", weight: 10 },
};

function parseAppStoreInput(input: string) {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/\/id(\d+)/);
  if (urlMatch) return { id: urlMatch[1], country: extractCountry(trimmed) };
  if (/^\d+$/.test(trimmed)) return { id: trimmed, country: "us" };
  return null;
}

function extractCountry(url: string) {
  const m = url.match(/apps\.apple\.com\/([a-z]{2})\//i);
  return m ? m[1].toLowerCase() : "us";
}

async function fetchAppData(id: string, country: string) {
  const res = await fetch(`/api/fetch-app?id=${id}&country=${country}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Lookup failed: ${res.status}`);
  return data;
}

function countSeparators(s: string) {
  return (s.match(/[|:\-–—]/g) || []).length;
}

function scoreApp(app: any) {
  const checks: any[] = [];

  const title = app.trackName || "";
  const subtitle: string | null = app.subtitle ?? null;

  checks.push({
    cat: "title",
    key: "title-length",
    label: "Title length \u2264 30 characters",
    status: title.length === 0 ? "fail" : title.length <= 30 ? "pass" : "partial",
    weight: 8,
    detail: `Your title is ${title.length} characters. Apple truncates at 30.`,
    fix: title.length > 30 ? `Shorten your title from "${title}" to 30 characters or fewer. Put the most important keyword first.` : null,
  });

  const subtitleLen = subtitle ? subtitle.length : 0;
  checks.push({
    cat: "title",
    key: "subtitle-present",
    label: "Subtitle present and using full 30 chars",
    status:
      subtitle === null
        ? "unknown"
        : subtitleLen === 0
        ? "fail"
        : subtitleLen >= 20 && subtitleLen <= 30
        ? "pass"
        : "partial",
    weight: 8,
    detail:
      subtitle === null
        ? "Could not read subtitle \u2014 App Store page scrape failed."
        : subtitleLen === 0
        ? "No subtitle set. Subtitles are 30-character keyword slots."
        : `Subtitle: "${subtitle}" (${subtitleLen}/30 chars).`,
    fix:
      subtitleLen === 0
        ? "Add a 30-character subtitle with keyword-rich value prop. Don't waste it on fluff like 'The official app'."
        : subtitleLen > 0 && subtitleLen < 20
        ? `Your subtitle is only ${subtitleLen} chars \u2014 you're leaving ${30 - subtitleLen} valuable keyword characters on the table.`
        : null,
  });

  checks.push({
    cat: "title",
    key: "no-keyword-stuffing",
    label: "No keyword stuffing in title",
    status: countSeparators(title) > 2 ? "fail" : countSeparators(title) === 2 ? "partial" : "pass",
    weight: 4,
    detail: countSeparators(title) > 1 ? "Title has multiple separators, suggesting keyword stuffing." : "Title reads naturally.",
    fix: countSeparators(title) > 2 ? "Remove keyword-stuffing separators (|, -, :). Apple's algorithm rewards clean brand-first titles." : null,
  });

  const description = app.description || "";
  const firstLines = description.split(/\n/).slice(0, 3).join(" ").trim();
  const firstLineLength = firstLines.length;

  checks.push({
    cat: "description",
    key: "desc-length",
    label: "Description length (800+ characters)",
    status: description.length >= 1500 ? "pass" : description.length >= 800 ? "partial" : "fail",
    weight: 5,
    detail: `Description is ${description.length} characters. Aim for 1,500-3,500 to cover features and keywords without rambling.`,
    fix: description.length < 800 ? "Your description is too short. Expand to at least 1,500 characters covering: hook (3 lines), key features, social proof, and CTA." : null,
  });

  checks.push({
    cat: "description",
    key: "desc-hook",
    label: "First 3 lines form a hook",
    status: firstLineLength > 80 && firstLineLength < 400 ? "pass" : firstLineLength > 40 ? "partial" : "fail",
    weight: 8,
    detail: `Your first 3 lines are ${firstLineLength} characters. Users see this before tapping "more".`,
    fix: firstLineLength < 80 ? "Rewrite your first 3 lines. This is the only copy 95% of visitors read. Lead with the benefit, not the company name." : null,
  });

  checks.push({
    cat: "description",
    key: "desc-structure",
    label: "Uses formatting (bullets, sections)",
    status: /[•●▪️★▶►→✓✔]|^[-*]/m.test(description) ? "pass" : "partial",
    weight: 4,
    detail: /[•●▪️★▶►→✓✔]|^[-*]/m.test(description) ? "Description uses visual separators." : "Flat text is hard to scan. Bullets and sections improve conversion.",
    fix: !/[•●▪️★▶►→✓✔]|^[-*]/m.test(description) ? "Break your description into scannable sections with bullets (\u2022) for features. Consider headers in CAPS for key sections." : null,
  });

  checks.push({
    cat: "description",
    key: "desc-cta",
    label: "Contains a call-to-action",
    status: /download|try|start|join|get started|sign up/i.test(description) ? "pass" : "fail",
    weight: 3,
    detail: /download|try|start|join|get started|sign up/i.test(description) ? "CTA detected." : "No clear CTA found.",
    fix: !/download|try|start|join|get started|sign up/i.test(description) ? "Add a clear CTA near the top and bottom of your description (e.g., 'Download now and start free')." : null,
  });

  const iphoneCount: number | null = app.iphoneScreenshotCount ?? null;
  const ipadCount: number | null = app.ipadScreenshotCount ?? null;
  const hasVideo: boolean | null = app.hasPreviewVideo ?? null;
  const hasIcon = Boolean(app.artworkUrl512 || app.artworkUrl100);

  checks.push({
    cat: "visuals",
    key: "icon",
    label: "High-resolution icon present",
    status: hasIcon ? "pass" : "fail",
    weight: 5,
    detail: hasIcon ? "Icon detected." : "No icon found.",
    fix: !hasIcon ? "Upload a high-res app icon (1024\u00d71024). This is your single most important asset." : null,
  });

  checks.push({
    cat: "visuals",
    key: "screenshot-count",
    label: "5+ iPhone screenshots",
    status:
      iphoneCount === null
        ? "unknown"
        : iphoneCount >= 5
        ? "pass"
        : iphoneCount >= 3
        ? "partial"
        : "fail",
    weight: 10,
    detail:
      iphoneCount === null
        ? "Could not read screenshot count \u2014 App Store page scrape failed."
        : `${iphoneCount} iPhone screenshot(s). Apple allows up to 10.`,
    fix:
      iphoneCount !== null && iphoneCount < 5
        ? `Upload ${10 - iphoneCount} more screenshots, up to the 10 maximum. Screenshots 1-3 drive conversion; 4-10 reinforce features.`
        : null,
  });

  checks.push({
    cat: "visuals",
    key: "ipad-screenshots",
    label: "iPad screenshots provided",
    status:
      ipadCount === null
        ? "unknown"
        : ipadCount >= 3
        ? "pass"
        : ipadCount > 0
        ? "partial"
        : "fail",
    weight: 3,
    detail:
      ipadCount === null
        ? "Could not read iPad screenshots \u2014 App Store page scrape failed."
        : `${ipadCount} iPad screenshot(s). If your app runs on iPad, you need these.`,
    fix:
      ipadCount !== null && ipadCount < 3
        ? "Add iPad-specific screenshots. Apple penalizes apps that reuse iPhone screenshots on iPad listings."
        : null,
  });

  checks.push({
    cat: "visuals",
    key: "video-preview",
    label: "App preview video",
    status: hasVideo === null ? "unknown" : hasVideo ? "pass" : "fail",
    weight: 7,
    detail:
      hasVideo === null
        ? "Could not read preview video \u2014 App Store page scrape failed."
        : hasVideo
        ? "App preview video detected."
        : "No app preview video found.",
    fix:
      hasVideo === false
        ? "Add a 15-30 second app preview video. Listings with videos convert 25-35% better than those without."
        : null,
  });

  const rating = app.averageUserRating || 0;
  const ratingCount = app.userRatingCount || 0;

  checks.push({
    cat: "social",
    key: "rating",
    label: "Average rating \u2265 4.0",
    status: rating >= 4.5 ? "pass" : rating >= 4.0 ? "partial" : "fail",
    weight: 8,
    detail: rating > 0 ? `Current rating: ${rating.toFixed(1)} \u2605` : "No rating yet.",
    fix: rating < 4.0 && rating > 0 ? "Rating below 4.0 suppresses rankings. Implement an in-app prompt using SKStoreReviewController at moments of user success, never after errors." : null,
  });

  checks.push({
    cat: "social",
    key: "rating-count",
    label: "500+ ratings",
    status: ratingCount >= 1000 ? "pass" : ratingCount >= 500 ? "partial" : ratingCount >= 100 ? "partial" : "fail",
    weight: 7,
    detail: `${ratingCount.toLocaleString()} rating(s). Volume signals trust and social proof.`,
    fix: ratingCount < 500 ? "Trigger ratings prompts more aggressively at moments of user delight (post-purchase, after goal completion, after 3+ sessions). Use the App Store Connect 3x-per-365-days limit fully." : null,
  });

  const updateDate = app.currentVersionReleaseDate ? new Date(app.currentVersionReleaseDate) : null;
  const daysSinceUpdate = updateDate ? Math.floor((Date.now() - updateDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;

  checks.push({
    cat: "freshness",
    key: "recent-update",
    label: "Updated in last 90 days",
    status: daysSinceUpdate <= 30 ? "pass" : daysSinceUpdate <= 90 ? "partial" : "fail",
    weight: 6,
    detail: updateDate ? `Last updated ${daysSinceUpdate} days ago.` : "Update date unknown.",
    fix: daysSinceUpdate > 90 ? "Ship an update. Apple's algorithm favors recently-updated apps. Even small bug-fix releases help." : null,
  });

  const releaseNotes = app.releaseNotes || "";
  checks.push({
    cat: "freshness",
    key: "release-notes",
    label: "Substantive release notes",
    status: releaseNotes.length >= 100 ? "pass" : releaseNotes.length >= 30 ? "partial" : "fail",
    weight: 4,
    detail: `Release notes are ${releaseNotes.length} characters. "Bug fixes and improvements" is a red flag.`,
    fix: releaseNotes.length < 100 ? "Write specific release notes. 'Bug fixes and improvements' signals a low-effort team to users. Call out 2-3 concrete changes." : null,
  });

  const languages = app.languageCodesISO2A || [];
  checks.push({
    cat: "localization",
    key: "language-count",
    label: "Localized in 5+ languages",
    status: languages.length >= 10 ? "pass" : languages.length >= 5 ? "partial" : "fail",
    weight: 10,
    detail: `Available in ${languages.length} language(s): ${languages.slice(0, 8).join(", ")}${languages.length > 8 ? "\u2026" : ""}`,
    fix: languages.length < 5 ? "Localize your listing into at least 5 languages. Start with Spanish, Portuguese (BR), German, Japanese, and French, each unlocks millions of search impressions." : null,
  });

  const catScores: Record<string, { earned: number; total: number; pct: number }> = {};
  Object.keys(CATEGORIES).forEach(cat => {
    const catChecks = checks.filter(c => c.cat === cat && c.status !== "unknown");
    const totalWeight = catChecks.reduce((s, c) => s + c.weight, 0);
    const earned = catChecks.reduce((s, c) => {
      const mult = c.status === "pass" ? 1 : c.status === "partial" ? 0.5 : 0;
      return s + c.weight * mult;
    }, 0);
    catScores[cat] = {
      earned: Math.round(earned),
      total: totalWeight,
      pct: totalWeight > 0 ? Math.round((earned / totalWeight) * 100) : 0,
    };
  });

  const totalScore = Object.keys(CATEGORIES).reduce((sum, cat) => {
    const { weight } = CATEGORIES[cat];
    return sum + (catScores[cat].pct / 100) * weight;
  }, 0);

  return {
    score: Math.round(totalScore),
    checks,
    categoryScores: catScores,
  };
}

function useTheme() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setDark(mq.matches);
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return dark;
}

function getTokens(dark: boolean) {
  return {
    bg: dark ? "#000" : "#fcfcfc",
    cardBg: dark ? "#0e0e0e" : "#ffffff",
    border: dark ? "#222" : "#e0e0e0",
    borderSoft: dark ? "#1a1a1a" : "#f0f0f0",
    fg: dark ? "#eeeeee" : "#202020",
    fgMuted: dark ? "#b4b4b4" : "#646464",
    fgSubtle: dark ? "#7b7b7b" : "#838383",
    inputBg: dark ? "#0e0e0e" : "#ffffff",
    btnBg: dark ? "#fff" : "#0090ff",
    btnFg: dark ? "#202020" : "#ffffff",
    blueBg: dark ? "#0d2847" : "#e6f4fe",
    blueFg: dark ? "#70b8ff" : "#0d74ce",
    codeBg: dark ? "#18191b" : "#f9f9fb",
    logoFill: dark ? "#ffffff" : "#000000",
    navBtnBg: dark ? "#fff" : "#202020",
    navBtnFg: dark ? "#202020" : "#fff",
    errorBg: dark ? "#2a1618" : "#fef2f2",
    errorFg: dark ? "#ff8b8b" : "#dc2626",
    green: "#30a46c",
    amber: "#ffba18",
    red: "#e5484d",
    gray: "#8d8d8d",
  };
}

function StatusIcon({ status, size = 18, t }: { status: string; size?: number; t: ReturnType<typeof getTokens> }) {
  if (status === "pass") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>;
  if (status === "partial") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.amber} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>;
  if (status === "unknown") return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.gray} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m15 9-6 6M9 9l6 6" /></svg>;
}

function ScoreRing({ score, size = 180, stroke = 10, t }: { score: number; size?: number; stroke?: number; t: ReturnType<typeof getTokens> }) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? t.green : score >= 60 ? t.amber : t.red;
  const trackColor = t.borderSoft;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: size * 0.32, fontWeight: 700, color: t.fg, letterSpacing: "-0.02em", lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 4 }}>/ 100</div>
      </div>
    </div>
  );
}

function CategoryBar({ cat, score, t }: { cat: string; score: { earned: number; total: number; pct: number }; t: ReturnType<typeof getTokens> }) {
  const color = score.pct >= 80 ? t.green : score.pct >= 50 ? t.amber : t.red;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ color: t.fg, fontSize: 14, fontWeight: 500 }}>{CATEGORIES[cat].label}</span>
        <span style={{ color: t.fgMuted, fontSize: 13, fontVariantNumeric: "tabular-nums" }}>{score.earned}<span style={{ color: t.fgMuted, opacity: 0.6 }}>/{score.total}</span></span>
      </div>
      <div style={{ height: 6, background: t.borderSoft, borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${score.pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </div>
    </div>
  );
}

function ExpoTopNav({ t }: { t: ReturnType<typeof getTokens> }) {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: `1px solid ${t.border}`, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <a href="https://expo.dev" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <svg width="22" height="22" viewBox="0 0 220 192" fill={t.logoFill}><path d="M107.6 53.6c1.4-2 2.9-2.3 4-2.3 1.1 0 3 .3 4.4 2.3 11 15 29.2 45.3 42.7 68 8.8 14.8 15.5 26.1 16.9 27.5 5.3 5.3 12.6 2.1 16.9-4.2 4.2-6.2 5.4-10.6 5.4-15.2 0-3.2-62-118.2-68.3-127.8C123.6.8 121.6 0 111.2 0h-8.6c-10.4 0-12 .8-18.3 10.4-6.2 9.6-68.3 124.6-68.3 127.8 0 4.6 1.2 9 5.4 15.2 4.3 6.3 11.6 9.5 16.9 4.2 1.4-1.4 8.1-12.7 16.9-27.5 13.5-22.7 31.5-53 42.4-68z" /></svg>
          <span style={{ fontWeight: 600, fontSize: 15, color: t.fg, letterSpacing: "-0.01em" }}>Expo</span>
        </a>
        <nav style={{ display: "flex", gap: 20, fontSize: 14 }}>
          {[
            { label: "Docs", href: "https://docs.expo.dev" },
            { label: "Product", href: "https://expo.dev/product" },
            { label: "Solutions", href: "https://expo.dev/solutions" },
            { label: "Pricing", href: "https://expo.dev/pricing" },
            { label: "Blog", href: "https://expo.dev/blog" },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ color: t.fgMuted, textDecoration: "none" }}>{l.label}</a>
          ))}
        </nav>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
        <a href="https://github.com/expo/expo" target="_blank" rel="noopener" style={{ color: t.fgMuted, display: "flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
          <GithubIcon size={14} />
          40K+
        </a>
        <a href="https://expo.dev/login" style={{ color: t.fgMuted, padding: "6px 10px", textDecoration: "none" }}>Log in</a>
        <a href="https://expo.dev/signup" style={{ background: t.navBtnBg, color: t.navBtnFg, padding: "7px 14px", borderRadius: 999, fontWeight: 500, textDecoration: "none" }}>Sign up</a>
      </div>
    </header>
  );
}

interface Props {
  dom?: import("expo/dom").DOMProps;
}

export default function ASOScoreDOM({}: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<any>(null);
  const [result, setResult] = useState<any>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiRecs, setAiRecs] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<{ label: string; url: string }[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const dark = useTheme();
  const t = getTokens(dark);

  useEffect(() => {
    const linkId = "inter-font";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap";
      document.head.appendChild(link);
    }
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.margin = "0";
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.height = "auto";
      rootEl.style.minHeight = "100vh";
      rootEl.style.overflow = "visible";
      rootEl.style.display = "block";
    }
  }, []);

  useEffect(() => {
    document.body.style.background = t.bg;
  }, [t.bg]);

  async function handleScan(e: any) {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);
    setApp(null);
    setAiRecs(null);

    const parsed = parseAppStoreInput(input);
    if (!parsed) {
      setError("Please enter a valid App Store URL (like https://apps.apple.com/us/app/.../id123456789) or an app ID.");
      return;
    }

    setLoading(true);
    try {
      const appData = await fetchAppData(parsed.id, parsed.country);
      const scored = scoreApp(appData);
      setApp(appData);
      setResult(scored);
      setActiveCategory(Object.keys(CATEGORIES).find(c => scored.categoryScores[c].pct < 80) || "title");
    } catch (err: any) {
      setError(err.message || "Something went wrong fetching that app.");
    } finally {
      setLoading(false);
    }
  }

  async function generateRecommendations() {
    if (!result || !app) return;
    setAiLoading(true);
    setAiRecs(null);
    setAiSources(null);

    const failedChecks = result.checks
      .filter((c: any) => c.status !== "pass" && c.fix)
      .map((c: any) => ({ status: c.status, label: c.label, fix: c.fix }));

    const payload = {
      app: {
        trackName: app.trackName,
        artistName: app.artistName,
        averageUserRating: app.averageUserRating,
        userRatingCount: app.userRatingCount,
        primaryGenreName: app.primaryGenreName,
      },
      failedChecks,
    };

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setAiRecs(`Error: ${data.error || "Failed to generate plan."}`);
      } else {
        setAiRecs(data.text || "No response generated.");
        setAiSources(data.sources || null);
      }
    } catch (err: any) {
      setAiRecs(`Network error: ${err?.message || "Unable to reach the server."}`);
    } finally {
      setAiLoading(false);
    }
  }

  function copyRecs() {
    if (!aiRecs) return;
    navigator.clipboard.writeText(aiRecs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const passCount = result ? result.checks.filter((c: any) => c.status === "pass").length : 0;
  const totalChecks = result ? result.checks.filter((c: any) => c.status !== "unknown").length : 0;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: t.bg, color: t.fg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <ExpoTopNav t={t} />

      {/* Hero */}
      <section style={{ maxWidth: 760, margin: "0 auto", padding: "88px 32px 48px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 999, background: t.blueBg, color: t.blueFg, fontSize: 12, fontWeight: 500, marginBottom: 24 }}>
          <SparklesIcon size={12} />
          ASO Score · Beta
        </div>
        <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "0 0 20px", color: t.fg }}>
          Grade your App Store listing.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.5, color: t.fgMuted, margin: "0 auto 36px", maxWidth: 560 }}>
          Paste an App Store URL. Get a grounded report across 6 ASO categories, plus an AI-written action plan for your team.
        </p>

        <form style={{ display: "flex", gap: 8, maxWidth: 560, margin: "0 auto", position: "relative" }} onSubmit={handleScan}>
          <div style={{ flex: 1, position: "relative" }}>
            <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
              <SearchIcon size={16} color={t.fgSubtle} />
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="apps.apple.com/us/app/.../id123456789"
              style={{ width: "100%", height: 48, padding: "0 16px 0 40px", fontSize: 14, fontFamily: "Inter, system-ui, sans-serif", borderRadius: 10, border: `1px solid ${t.border}`, background: t.inputBg, color: t.fg, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input}
            style={{ height: 48, padding: "0 22px", borderRadius: 10, border: 0, background: t.btnBg, color: t.btnFg, fontWeight: 500, fontSize: 14, cursor: loading || !input ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, opacity: loading || !input ? 0.5 : 1 }}
          >
            {loading ? <><LoaderIcon size={14} /> Scanning</> : <>Grade it <ArrowRightIcon size={14} /></>}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 20, fontSize: 14, padding: "12px 18px", borderRadius: 999, display: "inline-block", background: t.errorBg, color: t.errorFg }}>
            {error}
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop: 18, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 12, color: t.fgSubtle }}>
            <span>Try</span>
            {[
              { label: "Partiful", url: "https://apps.apple.com/us/app/partiful/id1479433002" },
              { label: "Phantom", url: "https://apps.apple.com/us/app/phantom-crypto-wallet/id1598432977" },
              { label: "Hipcamp", url: "https://apps.apple.com/us/app/hipcamp-camping-rvs-cabins/id1440066037" },
            ].map(ex => (
              <button
                key={ex.label}
                onClick={() => setInput(ex.url)}
                style={{ padding: "3px 10px", border: `1px solid ${t.border}`, borderRadius: 999, color: t.fgMuted, background: "transparent", cursor: "pointer", fontSize: 12 }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Results */}
      {result && app && (
        <section style={{ maxWidth: 1024, margin: "0 auto", padding: "0 32px 96px" }}>

          {/* App + score row */}
          <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32, display: "grid", gridTemplateColumns: "240px 1fr", gap: 40, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <ScoreRing score={result.score} size={180} stroke={10} t={t} />
              <div style={{ marginTop: 16, fontSize: 14, fontWeight: 600, color: t.fg }}>
                {result.score >= 80 ? "Strong" : result.score >= 60 ? "Needs work" : "Critical"}
              </div>
              <div style={{ fontSize: 12, color: t.fgMuted, marginTop: 2 }}>{passCount} of {totalChecks} checks passing</div>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                {app.artworkUrl100 && (
                  <img src={app.artworkUrl512 || app.artworkUrl100} alt="" style={{ width: 52, height: 52, borderRadius: 12 }} />
                )}
                {!app.artworkUrl100 && (
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: "linear-gradient(135deg,#2b7d4e,#0f4e2a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700 }}>{(app.trackName || "?")[0]}</div>
                )}
                <div>
                  <div style={{ fontSize: 11, color: t.blueFg, fontWeight: 500, marginBottom: 2 }}>{(app.primaryGenreName || "").toUpperCase()}</div>
                  <div style={{ fontSize: 17, fontWeight: 600, color: t.fg, letterSpacing: "-0.01em" }}>{app.trackName}</div>
                  <div style={{ fontSize: 13, color: t.fgMuted }}>
                    {app.artistName}
                    {app.averageUserRating ? <> · {app.averageUserRating.toFixed(1)} \u2605 · {(app.userRatingCount || 0).toLocaleString()} ratings</> : null}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {Object.keys(CATEGORIES).map(c => (
                  <div key={c} onClick={() => setActiveCategory(c)} style={{ cursor: "pointer" }}>
                    <CategoryBar cat={c} score={result.categoryScores[c]} t={t} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Category tabs + checks */}
          <div style={{ marginTop: 24, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ display: "flex", borderBottom: `1px solid ${t.borderSoft}`, padding: "0 8px", gap: 2, overflowX: "auto" }}>
              {Object.keys(CATEGORIES).map(c => (
                <button key={c} onClick={() => setActiveCategory(c)} style={{ background: "transparent", border: 0, padding: "16px 14px", fontSize: 13, fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, color: activeCategory === c ? t.fg : t.fgMuted, borderBottom: activeCategory === c ? `2px solid ${t.fg}` : "2px solid transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
                  {CATEGORIES[c].label}
                  <span style={{ marginLeft: 6, fontSize: 11, color: t.fgSubtle, fontVariantNumeric: "tabular-nums" }}>{result.categoryScores[c].pct}%</span>
                </button>
              ))}
            </div>
            <div style={{ padding: 8 }}>
              {result.checks.filter((c: any) => c.cat === activeCategory).map((check: any) => (
                <div key={check.key} style={{ padding: "18px 20px", borderRadius: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ paddingTop: 1 }}><StatusIcon status={check.status} size={18} t={t} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: t.fg, marginBottom: 4 }}>{check.label}</div>
                    <div style={{ fontSize: 13.5, color: t.fgMuted, lineHeight: 1.5 }}>{check.detail}</div>
                    {check.fix && check.status !== "pass" && check.status !== "unknown" && (
                      <div style={{ marginTop: 10, padding: "10px 14px", background: t.codeBg, border: `1px solid ${t.border}`, borderRadius: 8, borderLeft: `3px solid ${check.status === "partial" ? t.amber : t.red}`, fontSize: 13, color: t.fg, lineHeight: 1.5 }}>
                        {check.fix}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: t.fgSubtle, fontVariantNumeric: "tabular-nums", padding: "2px 8px", border: `1px solid ${t.border}`, borderRadius: 6, whiteSpace: "nowrap" }}>{check.weight} pts</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI plan */}
          <div style={{ marginTop: 24, background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: t.blueFg, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>AI action plan</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: t.fg, letterSpacing: "-0.01em" }}>Prioritized fixes for {app.trackName}</div>
                <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 4 }}>Grounded in Eronred/aso-skills + Adjust ASO guide</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {aiRecs && (
                  <button onClick={copyRecs} style={{ background: "transparent", color: t.fg, border: `1px solid ${t.border}`, borderRadius: 999, padding: "10px 16px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    {copied ? <><CheckIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy</>}
                  </button>
                )}
                <button
                  onClick={generateRecommendations}
                  disabled={aiLoading}
                  style={{ background: t.btnBg, color: t.btnFg, border: 0, borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1 }}
                >
                  {aiLoading ? <><LoaderIcon size={13} /> Generating</> : <><SparklesIcon size={13} /> {aiRecs ? "Regenerate plan" : "Generate plan"}</>}
                </button>
              </div>
            </div>

            {!aiRecs && !aiLoading && (
              <div style={{ fontSize: 14, padding: "24px 0", color: t.fgSubtle }}>
                An AI-written action plan, grounded in trusted ASO references. Click Generate plan when you're ready.
              </div>
            )}

            {aiLoading && (
              <div style={{ padding: "24px 0", display: "flex", alignItems: "center", justifyContent: "center", color: t.fgMuted, fontSize: 14 }}>
                <LoaderIcon size={16} /><span style={{ marginLeft: 10 }}>Analyzing your listing...</span>
              </div>
            )}

            {aiRecs && (
              <>
                <div style={{ fontSize: 15, lineHeight: 1.65, color: t.fg, whiteSpace: "pre-wrap" }}>
                  {aiRecs}
                </div>
                {aiSources && aiSources.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${t.border}` }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: t.fgSubtle, marginBottom: 10 }}>
                      Grounded in
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {aiSources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: `1px solid ${t.border}`, color: t.fgMuted, textDecoration: "none" }}>
                          {s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ marginTop: 48, textAlign: "center", fontSize: 13, color: t.fgSubtle }}>
            Built by <a href="https://expo.dev" style={{ color: t.fgMuted, textDecoration: "underline" }}>Expo</a> {"\u2014"} the framework for universal native apps.
          </div>
        </section>
      )}

      {!result && (
        <footer style={{ borderTop: `1px solid ${t.border}`, marginTop: 96, padding: "32px 32px", textAlign: "center" }}>
          <div style={{ fontSize: 13, color: t.fgSubtle }}>
            Built by <a href="https://expo.dev" style={{ color: t.fgMuted, textDecoration: "underline" }}>Expo</a> {"\u2014"} the framework for universal native apps.
          </div>
        </footer>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
