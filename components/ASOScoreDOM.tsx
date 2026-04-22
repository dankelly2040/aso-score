"use dom";

import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, Copy, Check, ArrowRight, Star, ImageIcon, FileText, Languages, Clock } from "lucide-react";

function GithubIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 .5C5.73.5.66 5.57.66 11.85c0 5.02 3.25 9.27 7.76 10.77.57.1.78-.25.78-.55 0-.27-.01-.98-.02-1.93-3.16.69-3.82-1.52-3.82-1.52-.52-1.31-1.26-1.66-1.26-1.66-1.03-.7.08-.69.08-.69 1.14.08 1.74 1.17 1.74 1.17 1.01 1.74 2.66 1.24 3.31.95.1-.73.4-1.24.72-1.53-2.52-.29-5.17-1.26-5.17-5.62 0-1.24.44-2.26 1.17-3.06-.12-.29-.51-1.46.11-3.04 0 0 .95-.3 3.12 1.17.9-.25 1.87-.38 2.83-.38s1.93.13 2.83.38c2.16-1.47 3.11-1.17 3.11-1.17.62 1.58.23 2.75.11 3.04.73.8 1.17 1.82 1.17 3.06 0 4.37-2.66 5.33-5.19 5.61.41.35.77 1.05.77 2.11 0 1.52-.01 2.75-.01 3.13 0 .3.2.66.79.55 4.51-1.5 7.76-5.75 7.76-10.77C23.34 5.57 18.27.5 12 .5z" />
    </svg>
  );
}

const CATEGORIES: Record<string, { label: string; weight: number; icon: any }> = {
  title: { label: "Title & subtitle", weight: 20, icon: FileText },
  description: { label: "Description", weight: 20, icon: FileText },
  visuals: { label: "Visual assets", weight: 25, icon: ImageIcon },
  social: { label: "Social proof", weight: 15, icon: Star },
  freshness: { label: "Freshness & trust", weight: 10, icon: Clock },
  localization: { label: "Localization", weight: 10, icon: Languages },
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
    label: "Title length ≤ 30 characters",
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
        ? "Could not read subtitle — App Store page scrape failed."
        : subtitleLen === 0
        ? "No subtitle set. Subtitles are 30-character keyword slots."
        : `Subtitle: "${subtitle}" (${subtitleLen}/30 chars).`,
    fix:
      subtitleLen === 0
        ? "Add a 30-character subtitle with keyword-rich value prop. Don't waste it on fluff like 'The official app'."
        : subtitleLen > 0 && subtitleLen < 20
        ? `Your subtitle is only ${subtitleLen} chars — you're leaving ${30 - subtitleLen} valuable keyword characters on the table.`
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
    fix: !/[•●▪️★▶►→✓✔]|^[-*]/m.test(description) ? "Break your description into scannable sections with bullets (•) for features. Consider headers in CAPS for key sections." : null,
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
    fix: !hasIcon ? "Upload a high-res app icon (1024×1024). This is your single most important asset." : null,
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
        ? "Could not read screenshot count — App Store page scrape failed."
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
        ? "Could not read iPad screenshots — App Store page scrape failed."
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
        ? "Could not read preview video — App Store page scrape failed."
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
    label: "Average rating ≥ 4.0",
    status: rating >= 4.5 ? "pass" : rating >= 4.0 ? "partial" : "fail",
    weight: 8,
    detail: rating > 0 ? `Current rating: ${rating.toFixed(1)} ★` : "No rating yet.",
    fix: rating < 4.0 && rating > 0 ? "Rating below 4.0 suppresses rankings. Implement an in-app prompt using SKStoreReviewController at moments of user success — never after errors." : null,
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
    detail: `Available in ${languages.length} language(s): ${languages.slice(0, 8).join(", ")}${languages.length > 8 ? "…" : ""}`,
    fix: languages.length < 5 ? "Localize your listing into at least 5 languages. Start with Spanish, Portuguese (BR), German, Japanese, and French — each unlocks millions of search impressions." : null,
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

function ScoreRing({ score }: { score: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22BE52" : score >= 60 ? "#E6CC1A" : "#E63333";

  return (
    <div style={{ position: "relative", width: 180, height: 180 }}>
      <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="90" cy="90" r={radius} stroke="#212225" strokeWidth="10" fill="none" />
        <circle
          cx="90" cy="90" r={radius}
          stroke={color}
          strokeWidth="10"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 600, color: "#EDEFF0" }}>{score}</div>
        <div style={{ fontSize: 12, marginTop: 4, color: "#B0B4BA" }}>/ 100</div>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle2 size={18} style={{ color: "#22BE52" }} />;
  if (status === "partial") return <AlertCircle size={18} style={{ color: "#E6CC1A" }} />;
  if (status === "unknown") return <AlertCircle size={18} style={{ color: "#8A8F98" }} />;
  return <XCircle size={18} style={{ color: "#E63333" }} />;
}

function CategoryBar({ cat, score }: { cat: string; score: { earned: number; total: number; pct: number } }) {
  const Icon = CATEGORIES[cat].icon;
  const color = score.pct >= 80 ? "#22BE52" : score.pct >= 50 ? "#E6CC1A" : "#E63333";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Icon size={16} style={{ color: "#B0B4BA" }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 6 }}>
          <span style={{ color: "#EDEFF0" }}>{CATEGORIES[cat].label}</span>
          <span style={{ color: "#B0B4BA" }}>{score.earned}/{score.total}</span>
        </div>
        <div style={{ height: 6, borderRadius: 999, overflow: "hidden", background: "#212225" }}>
          <div
            style={{
              height: "100%",
              width: `${score.pct}%`,
              background: color,
              borderRadius: 999,
              transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
      </div>
    </div>
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

  useEffect(() => {
    const linkId = "inter-font";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://rsms.me/inter/inter.css";
      document.head.appendChild(link);
    }
    document.documentElement.style.height = "auto";
    document.documentElement.style.overflow = "auto";
    document.body.style.height = "auto";
    document.body.style.overflow = "auto";
    document.body.style.margin = "0";
    document.body.style.background = "#000";
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.style.height = "auto";
      rootEl.style.minHeight = "100vh";
      rootEl.style.overflow = "visible";
      rootEl.style.display = "block";
    }
  }, []);

  async function handleScan(e: any) {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);
    setApp(null);
    setAiRecs(null);

    const parsed = parseAppStoreInput(input);
    if (!parsed) {
      setError("Please enter a valid App Store URL (like https://apps.apple.com/us/app/…/id123456789) or an app ID.");
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

  const baseFont = { fontFamily: "Inter, 'Inter Fallback', system-ui, sans-serif" };
  const surface = "#181A1B";
  const border = "#2A2C30";
  const textPrimary = "#EDEFF0";
  const textMuted = "#B0B4BA";
  const textDim = "#5A5E6A";

  const navLink: any = { fontSize: 14, color: textPrimary, textDecoration: "none", fontWeight: 400 };
  const ghostBtn: any = { fontSize: 14, padding: "0 16px", height: 36, borderRadius: 999, background: "#212225", color: "#FFF", border: `1px solid ${border}`, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", fontWeight: 500 };
  const subtleTextBtn: any = { fontSize: 14, color: textMuted, textDecoration: "none", background: "transparent", border: "none", padding: 0, cursor: "pointer", fontWeight: 400 };

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#000", color: textPrimary, ...baseFont }}>
      {/* Header — mirror expo.dev */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 32px", maxWidth: 1440, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="https://expo.dev" style={{ display: "inline-flex", alignItems: "center", gap: 10, textDecoration: "none", color: textPrimary }}>
            <svg width="26" height="23" viewBox="0 0 26 23" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.37 5.4c.16-.23.35-.26.5-.26.16 0 .38.06.58.32 1.6 2.18 4.27 6.6 6.25 9.87 1.29 2.13 2.28 3.77 2.5 4 .8.85 1.9.32 2.53-.6.62-.91.8-1.55.8-2.23 0-.46-9.02-17.07-9.92-18.45C14.74.72 14.47 0 13.04 0h-1.07c-1.43 0-1.75.72-2.62 2.05C8.45 3.43 0 20.04 0 20.5c0 .68.18 1.32.8 2.23.63.92 1.73 1.45 2.53.6.22-.23 1.21-1.87 2.5-4C7.81 16.06 10.77 11.58 12.37 5.4z" fill={textPrimary}/>
            </svg>
            <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>Expo</span>
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <a href="https://docs.expo.dev" style={navLink}>Docs</a>
            <a href="https://expo.dev/product" style={navLink}>Product</a>
            <a href="https://expo.dev/solutions" style={navLink}>Solutions</a>
            <a href="https://expo.dev/pricing" style={navLink}>Pricing</a>
            <a href="https://expo.dev/blog" style={navLink}>Blog</a>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <a href="https://github.com/expo/expo" target="_blank" rel="noopener" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: textMuted, textDecoration: "none", padding: "6px 12px", borderRadius: 999, border: `1px solid ${border}` }}>
            <GithubIcon size={13} /> 40K+
          </a>
          <a href="https://expo.dev/login" style={navLink}>Log in</a>
          <a href="https://expo.dev/signup" style={ghostBtn}>Sign up</a>
        </div>
      </nav>

      {/* Hero — prominent input */}
      <section style={{ maxWidth: 800, margin: "0 auto", padding: "96px 24px 64px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", padding: "0 14px", borderRadius: 16, marginBottom: 32, background: "#143F6E", color: "#7DB8FF", minHeight: 32, fontSize: 14 }}>
          <Sparkles size={13} style={{ marginRight: 8 }} /> ASO Score · Beta
        </div>
        <h1 style={{ fontWeight: 600, letterSpacing: "-0.025em", margin: 0, marginBottom: 24, fontSize: "clamp(44px, 6.5vw, 64px)", lineHeight: 1.04, color: textPrimary }}>
          Grade your App Store listing.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, margin: 0, marginBottom: 48, maxWidth: 580, marginLeft: "auto", marginRight: "auto", color: textMuted }}>
          Paste an App Store URL. Get a grounded report across 6 ASO categories, plus an AI-written action plan for your team.
        </p>

        <form onSubmit={handleScan} style={{ display: "flex", flexDirection: "row", gap: 8, maxWidth: 720, margin: "0 auto", flexWrap: "wrap" }}>
          <div style={{ flex: 1, position: "relative", minWidth: 320 }}>
            <Search size={18} style={{ position: "absolute", left: 20, top: "50%", transform: "translateY(-50%)", color: textDim }} />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="apps.apple.com/us/app/…/id123456789"
              style={{ width: "100%", paddingLeft: 52, paddingRight: 20, borderRadius: 999, outline: "none", fontSize: 16, background: surface, border: `1px solid ${border}`, color: textPrimary, height: 64, boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input}
            style={{ padding: "0 32px", borderRadius: 999, fontWeight: 500, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading || !input ? 0.5 : 1, background: "#FFF", color: "#111213", height: 64, minWidth: 140, border: "none", cursor: loading || !input ? "not-allowed" : "pointer", boxShadow: "0px 1px 2px 0px rgba(14,18,27,0.06), inset 0 0 0 1px #335CFF" }}
          >
            {loading ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Scanning</> : <>Grade it <ArrowRight size={16} /></>}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 20, fontSize: 14, padding: "12px 18px", borderRadius: 999, display: "inline-block", background: "#2A1618", color: "#FF8B8B" }}>
            {error}
          </div>
        )}

        {!result && !loading && (
          <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, fontSize: 13, color: textDim, alignItems: "center" }}>
            <span>Try</span>
            {[
              { label: "Partiful", url: "https://apps.apple.com/us/app/partiful/id1479433002" },
              { label: "Phantom", url: "https://apps.apple.com/us/app/phantom-crypto-wallet/id1598432977" },
              { label: "Hipcamp", url: "https://apps.apple.com/us/app/hipcamp-camping-rvs-cabins/id1440066037" },
            ].map(ex => (
              <button
                key={ex.label}
                onClick={() => setInput(ex.url)}
                style={{ padding: "4px 12px", borderRadius: 999, border: `1px solid ${border}`, color: textMuted, background: "transparent", cursor: "pointer", fontSize: 13 }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {result && app && (
        <section style={{ maxWidth: 1152, margin: "0 auto", padding: "0 24px 96px" }}>
          {/* Primary: one unified hero result card */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: 48, marginBottom: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {app.artworkUrl100 && (
                  <img src={app.artworkUrl512 || app.artworkUrl100} alt="" style={{ borderRadius: 20, width: 88, height: 88 }} />
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, marginBottom: 6, color: "#7DB8FF", fontWeight: 500 }}>{app.primaryGenreName}</div>
                  <div style={{ fontWeight: 600, fontSize: 24, color: textPrimary, letterSpacing: "-0.01em", lineHeight: 1.2 }}>{app.trackName}</div>
                  <div style={{ fontSize: 14, color: textMuted, marginTop: 4 }}>
                    {app.artistName}
                    {app.averageUserRating ? <> · <Star size={12} style={{ display: "inline", marginRight: 3, verticalAlign: "middle" }} fill="#E6CC1A" color="#E6CC1A" /><span style={{ color: textPrimary, fontWeight: 500 }}>{app.averageUserRating.toFixed(1)}</span> <span style={{ color: textDim }}>({(app.userRatingCount || 0).toLocaleString()})</span></> : null}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 16, color: textMuted, lineHeight: 1.5, maxWidth: 520 }}>
                {result.score >= 80
                  ? `Strong ASO foundation. ${result.checks.filter((c: any) => c.status !== "pass" && c.status !== "unknown").length} refinements can push this higher.`
                  : result.score >= 60
                  ? `Listing is functional but leaves opportunity on the table. ${result.checks.filter((c: any) => c.status === "fail").length} critical issues and ${result.checks.filter((c: any) => c.status === "partial").length} partial passes to address.`
                  : `Listing has critical issues that are suppressing rankings and conversions. Start with the ${result.checks.filter((c: any) => c.status === "fail").length} failing checks below.`}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ fontSize: 144, fontWeight: 600, lineHeight: 1, letterSpacing: "-0.04em", color: result.score >= 80 ? "#22BE52" : result.score >= 60 ? "#E6CC1A" : "#E63333" }}>
                {result.score}
              </div>
              <div style={{ fontSize: 13, color: textDim, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Out of 100
              </div>
            </div>
          </div>

          {/* Secondary: dense category grid */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: textDim, marginBottom: 16 }}>
              Category breakdown
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {Object.keys(CATEGORIES).map(cat => {
                const s = result.categoryScores[cat];
                const Icon = CATEGORIES[cat].icon;
                const color = s.pct >= 80 ? "#22BE52" : s.pct >= 50 ? "#E6CC1A" : "#E63333";
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      textAlign: "left",
                      background: isActive ? "#1E2024" : surface,
                      border: `1px solid ${isActive ? "#3A3D44" : border}`,
                      borderRadius: 10,
                      padding: 16,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Icon size={14} style={{ color: textMuted }} />
                      <div style={{ fontSize: 13, color: textMuted, fontVariantNumeric: "tabular-nums" }}>
                        <span style={{ color: textPrimary, fontWeight: 500 }}>{s.earned}</span>
                        <span style={{ color: textDim }}>/{s.total}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: textPrimary, fontWeight: 500 }}>{CATEGORIES[cat].label}</div>
                    <div style={{ height: 3, borderRadius: 999, background: "#212225", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s.pct}%`, background: color, borderRadius: 999, transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tertiary: check details as clean rows */}
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: textDim, marginBottom: 8 }}>
                  {activeCategory && CATEGORIES[activeCategory].label}
                </div>
                <div style={{ fontWeight: 600, color: textPrimary, fontSize: 22, letterSpacing: "-0.01em" }}>
                  Check details
                </div>
              </div>
              <div style={{ fontSize: 13, color: textDim }}>
                Click a category above to switch
              </div>
            </div>
            <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, overflow: "hidden" }}>
              {result.checks.filter((c: any) => c.cat === activeCategory).map((check: any, idx: number, arr: any[]) => (
                <div
                  key={check.key}
                  style={{ padding: 24, display: "flex", gap: 16, borderBottom: idx < arr.length - 1 ? `1px solid ${border}` : "none" }}
                >
                  <div style={{ paddingTop: 2 }}><StatusIcon status={check.status} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 500, fontSize: 15, marginBottom: 4, color: textPrimary }}>
                      {check.label}
                    </div>
                    <div style={{ fontSize: 14, color: textMuted, lineHeight: 1.5 }}>
                      {check.detail}
                    </div>
                    {check.fix && check.status !== "pass" && check.status !== "unknown" && (
                      <div style={{ marginTop: 12, fontSize: 14, paddingLeft: 14, color: "#7DB8FF", borderLeft: "2px solid #143F6E", lineHeight: 1.5 }}>
                        {check.fix}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: textDim, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                    {check.weight} pts
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quiet: AI plan */}
          <div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: textDim, marginBottom: 8 }}>
                  Next steps
                </div>
                <div style={{ fontWeight: 600, color: textPrimary, fontSize: 22, letterSpacing: "-0.01em" }}>
                  Prioritized action plan
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {aiRecs && (
                  <button onClick={copyRecs} style={subtleTextBtn}>
                    {copied ? <><Check size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Copied</> : <><Copy size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} /> Copy</>}
                  </button>
                )}
                <button
                  onClick={generateRecommendations}
                  disabled={aiLoading}
                  style={{ ...ghostBtn, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1 }}
                >
                  {aiLoading ? <><Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> Generating</> : <><Sparkles size={13} /> {aiRecs ? "Regenerate" : "Generate plan"}</>}
                </button>
              </div>
            </div>

            {!aiRecs && !aiLoading && (
              <div style={{ fontSize: 14, padding: "32px 0", color: textDim }}>
                An AI-written action plan, grounded in trusted ASO references. Click <em style={{ color: textMuted, fontStyle: "normal" }}>Generate plan</em> when you're ready.
              </div>
            )}

            {aiLoading && (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: 32, display: "flex", alignItems: "center", justifyContent: "center", color: textMuted, fontSize: 14 }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite", marginRight: 10 }} /> Analyzing your listing…
              </div>
            )}

            {aiRecs && (
              <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: 12, padding: 32 }}>
                <div style={{ fontSize: 14, lineHeight: 1.65, whiteSpace: "pre-wrap", color: textPrimary }}>
                  {aiRecs}
                </div>
                {aiSources && aiSources.length > 0 && (
                  <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${border}` }}>
                    <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: textDim, marginBottom: 10 }}>
                      Grounded in
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {aiSources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: `1px solid ${border}`, color: textMuted, textDecoration: "none" }}>
                          {s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      <footer style={{ borderTop: `1px solid ${border}`, marginTop: result ? 0 : 96, padding: "32px 32px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: textDim }}>
          Built by <a href="https://expo.dev" style={{ color: textMuted, textDecoration: "none", borderBottom: `1px solid ${border}` }}>Expo</a> — the framework for universal native apps.
        </div>
      </footer>

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
