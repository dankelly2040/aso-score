"use dom";

// ---------------------------------------------------------------------------
// ASO Score — web UI (DOM component).
//
// Runs inside Expo Router's `"use dom"` iframe. All styling is inline so
// Metro doesn't have to route CSS through the native bundle. Layout is
// responsive via a single `isDesktop` boolean (media query via
// window.innerWidth) so the same tree renders correctly on phone and
// desktop without duplicating components.
//
// Visual reference: Figma designs (Apr 2026 — shown to the user in-thread).
// Header = Expo breadcrumb, hero = centered with beta pill + stacked
// headline + pill input + branded TRY chips. Score card is a single wide
// card with two columns on desktop (ring on left, category list on right)
// and a stacked version on mobile. Below it, each of the six categories
// is its own collapsible accordion whose check rows can individually
// expand to show ISSUE / SUGGESTED ACTION detail.
// ---------------------------------------------------------------------------

import { useState, useEffect } from "react";
import {
  scoreApp,
  parseAppleUrl,
  CATEGORIES,
  estimateDownloads,
  formatDownloadCount,
  type AppData,
  type ScoreResult,
  type CategoryKey,
  type Check,
} from "@aso/core";

// ---------------------------------------------------------------------------
// Icon primitives.
// ---------------------------------------------------------------------------

function ArrowRightIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function SparkleIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l1.8 5.5a3 3 0 0 0 1.9 1.9L21 11l-5.3 1.6a3 3 0 0 0-1.9 1.9L12 20l-1.8-5.5a3 3 0 0 0-1.9-1.9L3 11l5.3-1.6a3 3 0 0 0 1.9-1.9L12 2z" />
    </svg>
  );
}

function LoaderIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "aso-spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ChevronIcon({ open, size = 18 }: { open: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 180ms ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PlusMinusIcon({ open, size = 12 }: { open: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      {!open && <path d="M12 5v14" />}
      <path d="M5 12h14" />
    </svg>
  );
}

function ShareIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <path d="M12 2v13" />
    </svg>
  );
}

function ExternalIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M8 7h9v9" />
    </svg>
  );
}

function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function SmallCheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Filled colored status circle with a white glyph (check / ! / x / ?).
function StatusBadge({ status, size = 22, t }: { status: Check["status"]; size?: number; t: ReturnType<typeof getTokens> }) {
  const bg =
    status === "pass" ? t.green :
    status === "partial" ? t.amber :
    status === "unknown" ? t.gray : t.red;
  const glyphSize = size * 0.5;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0 }}>
      {status === "pass" && (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
      {status === "partial" && (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v5" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
      )}
      {status === "unknown" && (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5" /><circle cx="12" cy="17" r="0.8" fill="currentColor" /></svg>
      )}
      {status === "fail" && (
        <svg width={glyphSize} height={glyphSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theme tokens. Design mocks are light-mode; dark-mode is a palette flip so
// OS dark-mode users don't get flash-banged.
// ---------------------------------------------------------------------------

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
    bg: dark ? "#0b0b0c" : "#ffffff",
    cardBg: dark ? "#131315" : "#ffffff",
    cardBorder: dark ? "#26262a" : "#e8e8ec",
    cardBorderSoft: dark ? "#1d1d20" : "#efeff2",
    fg: dark ? "#f3f3f5" : "#111113",
    fgMuted: dark ? "#a1a1a8" : "#62626a",
    fgSubtle: dark ? "#70707a" : "#8f8f97",

    inputBg: dark ? "#17171a" : "#ffffff",
    inputBorder: dark ? "#26262a" : "#dcdce0",

    ctaBg: "#0084ff",
    ctaFg: "#ffffff",

    // Yellow Beta pill: soft yellow background, deep-amber text.
    badgeBg: dark ? "#3a2e00" : "#fff2c4",
    badgeFg: dark ? "#ffd35c" : "#8a5a00",

    shareBtnBg: dark ? "#1a1a1d" : "#f4f4f6",
    shareBtnFg: dark ? "#f3f3f5" : "#111113",

    green: dark ? "#3acf7d" : "#1fa463",
    amber: dark ? "#f2b03f" : "#d69418",
    red: dark ? "#ff6262" : "#dc2b2b",
    gray: dark ? "#8a8a94" : "#9a9aa2",

    greenSoft: dark ? "#0e2a1c" : "#e7f6ec",
    amberSoft: dark ? "#32230a" : "#fdf3dc",
    redSoft: dark ? "#2e1214" : "#fbe6e6",
    graySoft: dark ? "#212125" : "#f1f1f3",

    // Issue/fix info panel background.
    panelBg: dark ? "#17171a" : "#f6f6f8",
    panelBorder: dark ? "#26262a" : "#ececf0",

    errorBg: dark ? "#2a1618" : "#fef2f2",
    errorFg: dark ? "#ff8b8b" : "#dc2626",
  };
}

// Media-query hook. Runs in the `use dom` iframe so `window` is always
// available on the client, but we still guard for SSR safety.
function useIsDesktop(breakpoint = 820) {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const update = () => setIsDesktop(window.innerWidth >= breakpoint);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [breakpoint]);
  return isDesktop;
}

// ---------------------------------------------------------------------------
// Score ring — same geometry as before, restyled to the design (thinner
// track, larger headline, /100 below).
// ---------------------------------------------------------------------------

function ScoreRing({ score, size, t }: { score: number; size: number; t: ReturnType<typeof getTokens> }) {
  const stroke = Math.max(8, Math.round(size * 0.06));
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? t.green : score >= 60 ? t.amber : t.red;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke={t.cardBorderSoft} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: Math.round(size * 0.36), fontWeight: 700, color: t.fg, letterSpacing: "-0.03em", lineHeight: 1 }}>
          {score}
        </div>
        <div style={{ fontSize: Math.max(11, Math.round(size * 0.07)), color: t.fgMuted, marginTop: 4 }}>
          /100
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top nav — Expo breadcrumb + expo.dev link. Minimal per design.
// ---------------------------------------------------------------------------

function ExpoLogo({ size = 18, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 192" fill={color} aria-hidden="true">
      <path d="M107.6 53.6c1.4-2 2.9-2.3 4-2.3 1.1 0 3 .3 4.4 2.3 11 15 29.2 45.3 42.7 68 8.8 14.8 15.5 26.1 16.9 27.5 5.3 5.3 12.6 2.1 16.9-4.2 4.2-6.2 5.4-10.6 5.4-15.2 0-3.2-62-118.2-68.3-127.8C123.6.8 121.6 0 111.2 0h-8.6c-10.4 0-12 .8-18.3 10.4-6.2 9.6-68.3 124.6-68.3 127.8 0 4.6 1.2 9 5.4 15.2 4.3 6.3 11.6 9.5 16.9 4.2 1.4-1.4 8.1-12.7 16.9-27.5 13.5-22.7 31.5-53 42.4-68z" />
    </svg>
  );
}

function TopNav({ t, isDesktop }: { t: ReturnType<typeof getTokens>; isDesktop: boolean }) {
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: isDesktop ? "20px 40px" : "16px 20px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <a href="https://expo.dev" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <ExpoLogo size={20} color={t.fg} />
          <span style={{ fontWeight: 600, fontSize: 15, color: t.fg, letterSpacing: "-0.01em" }}>Expo</span>
        </a>
        <span style={{ color: t.fgSubtle, fontSize: 15 }}>/</span>
        <span style={{ color: t.fgMuted, fontSize: 15, fontWeight: 500 }}>ASO Score</span>
      </div>
      <a href="https://expo.dev" target="_blank" rel="noopener" style={{ color: t.fgMuted, textDecoration: "none", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 4 }}>
        expo.dev <ExternalIcon size={11} />
      </a>
    </header>
  );
}

// ---------------------------------------------------------------------------
// TRY chips — colored brand square + app name, clickable to prefill input.
// ---------------------------------------------------------------------------

interface TryChipSpec {
  label: string;
  url: string;
  bg: string;
  fg: string;
  mark: string;
}

const TRY_CHIPS: TryChipSpec[] = [
  { label: "Partiful", url: "https://apps.apple.com/us/app/partiful-party-invite-maker/id1662982304", bg: "#111111", fg: "#ffffff", mark: "P" },
  { label: "Phantom",  url: "https://apps.apple.com/us/app/phantom-crypto-wallet/id1598432977",         bg: "#ab9ff2", fg: "#ffffff", mark: "P" },
  { label: "Hipcamp",  url: "https://apps.apple.com/us/app/hipcamp-camping-rvs-cabins/id1440066037",    bg: "#ef6c3a", fg: "#ffffff", mark: "H" },
];

function TryChip({ chip, onClick, t }: { chip: TryChipSpec; onClick: () => void; t: ReturnType<typeof getTokens> }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "4px 12px 4px 4px",
        borderRadius: 999,
        border: `1px solid ${t.cardBorder}`,
        background: t.cardBg,
        color: t.fg,
        fontFamily: "Inter, system-ui, sans-serif",
        cursor: "pointer",
      }}
    >
      <span style={{ width: 22, height: 22, borderRadius: 6, background: chip.bg, color: chip.fg, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em" }}>
        {chip.mark}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{chip.label}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Score card — ring/app on left, category list + Share on right (desktop).
// Stacked on mobile with ring at top.
// ---------------------------------------------------------------------------

const ORDERED_CATEGORIES: CategoryKey[] = [
  "title", "description", "visuals", "social", "freshness", "localization",
];

function catColor(pct: number, t: ReturnType<typeof getTokens>): string {
  return pct >= 80 ? t.green : pct >= 50 ? t.amber : t.red;
}

function ScoreCard({
  app, result, downloadEstimate, passCount, totalChecks, isDesktop, t,
}: {
  app: AppData;
  result: ScoreResult;
  downloadEstimate: ReturnType<typeof estimateDownloads>;
  passCount: number;
  totalChecks: number;
  isDesktop: boolean;
  t: ReturnType<typeof getTokens>;
}) {
  const ringSize = isDesktop ? 170 : 150;
  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 24, padding: isDesktop ? "40px 48px" : 28, display: "grid", gridTemplateColumns: isDesktop ? "minmax(0,1fr) minmax(0,1fr)" : "1fr", gap: isDesktop ? 56 : 28, alignItems: "center" }}>

      {/* Left column: ring + app identity */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
        {/* Ring with icon overlapping its bottom arc — the detail that sells the composition. */}
        <div style={{ position: "relative", width: ringSize, paddingBottom: 20 }}>
          <ScoreRing score={result.score} size={ringSize} t={t} />
          {app.artworkUrl512 || app.artworkUrl100 ? (
            <img
              src={app.artworkUrl512 || app.artworkUrl100}
              alt=""
              style={{
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
                width: 52,
                height: 52,
                borderRadius: 12,
                boxShadow: `0 0 0 4px ${t.cardBg}`,
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                left: "50%",
                bottom: 0,
                transform: "translateX(-50%)",
                width: 52,
                height: 52,
                borderRadius: 12,
                background: t.graySoft,
                color: t.fg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                boxShadow: `0 0 0 4px ${t.cardBg}`,
              }}
            >
              {(app.trackName || "?")[0]}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: isDesktop ? 22 : 20, fontWeight: 700, letterSpacing: "-0.02em", color: t.fg, lineHeight: 1.2, maxWidth: 280 }}>
            {app.trackName}
          </div>
          <div style={{ fontSize: 13, color: t.fgMuted, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <span>{app.artistName}</span>
            {app.averageUserRating ? (
              <>
                <span aria-hidden="true">·</span>
                <span style={{ color: t.amber }}>★</span>
                <span>{app.averageUserRating.toFixed(1)}</span>
                <span style={{ color: t.fgSubtle }}>({(app.userRatingCount || 0).toLocaleString()})</span>
              </>
            ) : null}
          </div>
          {downloadEstimate && (
            <div title={`Estimate method: ${downloadEstimate.method}. Confidence: ${downloadEstimate.confidence}.`} style={{ fontSize: 12, color: t.fgSubtle, marginTop: 2 }}>
              ≈ {formatDownloadCount(downloadEstimate.monthly)} installs/mo · {downloadEstimate.confidence} confidence
            </div>
          )}
        </div>
      </div>

      {/* Right column: category list + share row */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ORDERED_CATEGORIES.map((key) => {
            const sc = result.categoryScores[key];
            const col = catColor(sc.pct, t);
            return (
              <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px solid ${t.cardBorderSoft}` }}>
                <span style={{ fontSize: 15, color: t.fg, fontWeight: 500 }}>{CATEGORIES[key].label}</span>
                <span style={{ fontSize: 15, fontWeight: 600, color: col, fontVariantNumeric: "tabular-nums" }}>
                  {sc.earned}/{sc.total}
                </span>
              </div>
            );
          })}
        </div>

        {/* Share + check-passing row */}
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button
            onClick={() => {
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(window.location.href);
              }
            }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: t.shareBtnBg, color: t.shareBtnFg, border: 0,
              borderRadius: 12, padding: "10px 16px",
              fontSize: 13.5, fontWeight: 500,
              fontFamily: "Inter, system-ui, sans-serif",
              cursor: "pointer",
            }}
          >
            <ShareIcon size={13} />
            Share report
          </button>
          <span style={{ fontSize: 13.5, color: t.fgMuted, fontVariantNumeric: "tabular-nums" }}>
            {passCount}/{totalChecks} check{totalChecks === 1 ? "" : "s"} passing
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Expandable check row — status badge, label, points pill, +/- toggle.
// Expanded view shows ISSUE + (if fix present) SUGGESTED ACTION.
// ---------------------------------------------------------------------------

function CheckRow({ check, t }: { check: Check; t: ReturnType<typeof getTokens> }) {
  const [open, setOpen] = useState(false);
  const statusColor =
    check.status === "pass" ? t.green :
    check.status === "partial" ? t.amber :
    check.status === "unknown" ? t.gray : t.red;
  const statusSoft =
    check.status === "pass" ? t.greenSoft :
    check.status === "partial" ? t.amberSoft :
    check.status === "unknown" ? t.graySoft : t.redSoft;
  const hasDetail = Boolean(check.detail);
  const hasFix = Boolean(check.fix) && check.status !== "pass" && check.status !== "unknown";

  return (
    <div style={{ border: `1px solid ${t.cardBorderSoft}`, borderRadius: 14, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <StatusBadge status={check.status} size={24} t={t} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 500, color: t.fg }}>
          {check.label}
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "4px 12px",
          borderRadius: 999,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: "Inter, system-ui, sans-serif",
          background: statusSoft,
          color: statusColor,
          whiteSpace: "nowrap",
          fontVariantNumeric: "tabular-nums",
        }}>
          {check.weight} points
        </div>
        {(hasDetail || hasFix) && (
          <button
            onClick={() => setOpen((x) => !x)}
            aria-label={open ? "Collapse check" : "Expand check"}
            style={{
              width: 26, height: 26, borderRadius: "50%",
              border: `1px solid ${t.cardBorder}`, background: t.cardBg,
              color: t.fgMuted, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <PlusMinusIcon open={open} size={12} />
          </button>
        )}
      </div>

      {open && (hasDetail || hasFix) && (
        <div style={{ marginTop: 12, padding: "14px 16px", background: t.panelBg, border: `1px solid ${t.panelBorder}`, borderRadius: 12 }}>
          {hasDetail && (
            <>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.fgSubtle, marginBottom: 6 }}>
                ISSUE
              </div>
              <div style={{ fontSize: 13, color: t.fg, lineHeight: 1.55 }}>{check.detail}</div>
            </>
          )}
          {hasFix && (
            <>
              <div style={{ fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 700, color: t.fgSubtle, marginTop: 14, marginBottom: 6 }}>
                SUGGESTED ACTION
              </div>
              <div style={{ fontSize: 13, color: t.fg, lineHeight: 1.55 }}>{check.fix}</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Category accordion — collapses to a single header row, expands to show
// the full set of check rows for that category.
// ---------------------------------------------------------------------------

function CategoryAccordion({
  cat, score, checks, open, onToggle, t,
}: {
  cat: CategoryKey;
  score: { earned: number; total: number; pct: number };
  checks: Check[];
  open: boolean;
  onToggle: () => void;
  t: ReturnType<typeof getTokens>;
}) {
  const col = catColor(score.pct, t);
  return (
    <div style={{ background: t.cardBg, borderTop: `1px solid ${t.cardBorder}`, padding: "0" }}>
      <button
        onClick={onToggle}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 4px",
          background: "transparent",
          border: 0,
          cursor: "pointer",
          fontFamily: "Inter, system-ui, sans-serif",
          color: t.fg,
        }}
      >
        <span style={{ display: "inline-flex", gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: t.fg }}>{CATEGORIES[cat].label}</span>
          <span style={{ fontSize: 15, fontWeight: 600, color: col, fontVariantNumeric: "tabular-nums" }}>
            {score.earned}/{score.total}
          </span>
        </span>
        <span style={{ color: t.fgMuted }}>
          <ChevronIcon open={open} size={20} />
        </span>
      </button>
      {open && (
        <div style={{ padding: "4px 0 20px" }}>
          {checks.map((c) => (
            <CheckRow key={c.key} check={c} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Footer — Expo-style columnar footer on desktop, simplified stack on mobile.
// ---------------------------------------------------------------------------

function Footer({ t, isDesktop }: { t: ReturnType<typeof getTokens>; isDesktop: boolean }) {
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    { title: "Product",   links: [
      { label: "Expo on GitHub",    href: "https://github.com/expo/expo" },
      { label: "Expo CLI on GitHub",href: "https://github.com/expo/expo" },
      { label: "Expo Services (EAS)", href: "https://expo.dev/eas" },
      { label: "EAS CLI on GitHub", href: "https://github.com/expo/eas-cli" },
      { label: "Expo Go",           href: "https://expo.dev/go" },
      { label: "Expo Orbit",        href: "https://expo.dev/orbit" },
      { label: "Snack",             href: "https://snack.expo.dev" },
    ]},
    { title: "Resources", links: [
      { label: "Documentation", href: "https://docs.expo.dev" },
      { label: "Blog",          href: "https://expo.dev/blog" },
      { label: "Changelog",     href: "https://expo.dev/changelog" },
      { label: "Support",       href: "https://expo.dev/support" },
      { label: "Trust center",  href: "https://expo.dev/trust" },
    ]},
    { title: "Solutions", links: [
      { label: "Enterprise",     href: "https://expo.dev/enterprise" },
      { label: "Startup",        href: "https://expo.dev/startup" },
      { label: "Solo devs",      href: "https://expo.dev/solo" },
      { label: "React web devs", href: "https://expo.dev/web" },
      { label: "E-commerce",     href: "https://expo.dev/ecommerce" },
      { label: "Crypto",         href: "https://expo.dev/crypto" },
      { label: "Finserv",        href: "https://expo.dev/finserv" },
      { label: "QSR",            href: "https://expo.dev/qsr" },
    ]},
    { title: "Company",   links: [
      { label: "Home",        href: "https://expo.dev" },
      { label: "Pricing",     href: "https://expo.dev/pricing" },
      { label: "Customers",   href: "https://expo.dev/customers" },
      { label: "Consultants", href: "https://expo.dev/consultants" },
      { label: "About",       href: "https://expo.dev/about" },
      { label: "Branding",    href: "https://expo.dev/branding" },
      { label: "Careers",     href: "https://expo.dev/careers" },
    ]},
    { title: "Legal",     links: [
      { label: "Terms of service",     href: "https://expo.dev/terms" },
      { label: "Acceptable use policy",href: "https://expo.dev/acceptable-use" },
      { label: "Privacy policy",       href: "https://expo.dev/privacy" },
      { label: "Privacy explained",    href: "https://expo.dev/privacy-explained" },
      { label: "Security",             href: "https://expo.dev/security" },
      { label: "Community guidelines", href: "https://expo.dev/community-guidelines" },
    ]},
  ];

  if (!isDesktop) {
    return (
      <footer style={{ borderTop: `1px solid ${t.cardBorderSoft}`, marginTop: 80, padding: "40px 20px 64px", textAlign: "center" }}>
        <div style={{ fontSize: 13, color: t.fgSubtle }}>
          Built by <a href="https://expo.dev" style={{ color: t.fgMuted, textDecoration: "underline" }}>Expo</a> — the framework for universal native apps.
        </div>
      </footer>
    );
  }

  return (
    <footer style={{ borderTop: `1px solid ${t.cardBorderSoft}`, marginTop: 96, padding: "48px 40px 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 220px) repeat(5, minmax(0, 1fr))", gap: 32, maxWidth: 1200, margin: "0 auto" }}>
        <div>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: t.fg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ExpoLogo size={20} color={t.bg} />
          </div>
          <div style={{ marginTop: 24, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: t.ctaBg, fontWeight: 600 }}>
            NEWSLETTER
          </div>
          <div style={{ marginTop: 8, fontSize: 13.5, color: t.fg, fontWeight: 500 }}>
            Stay in touch with all things expo
          </div>
          <button style={{ marginTop: 12, padding: "8px 18px", border: 0, borderRadius: 999, background: t.ctaBg, color: "#fff", fontWeight: 500, fontSize: 13, cursor: "pointer" }}>
            Subscribe
          </button>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.fg, marginBottom: 14 }}>{col.title}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {col.links.map((l) => (
                <a key={l.label} href={l.href} style={{ fontSize: 13, color: t.fgMuted, textDecoration: "none" }}>
                  {l.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", maxWidth: 1200, margin: "48px auto 0", paddingTop: 20, borderTop: `1px solid ${t.cardBorderSoft}`, fontSize: 12, color: t.fgSubtle }}>
        <div>©2026 Expo</div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: t.green, display: "inline-block" }} />
            All Systems Operational
          </span>
          <span>Auto</span>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main component.
// ---------------------------------------------------------------------------

async function fetchAppData(id: string, country: string): Promise<AppData> {
  const res = await fetch(`/api/fetch-app?id=${id}&country=${country}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Lookup failed: ${res.status}`);
  return data as AppData;
}

interface Props {
  dom?: import("expo/dom").DOMProps;
  /**
   * Optional App Store URL or ID to auto-scan on mount. Used by the Chrome
   * extension's "Open full report" deep-link so the home route auto-scans
   * the linked app.
   */
  initialUrl?: string;
}

export default function ASOScoreDOM({ initialUrl }: Props) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [app, setApp] = useState<AppData | null>(null);
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [expandedCats, setExpandedCats] = useState<Set<CategoryKey>>(new Set());
  const [aiRecs, setAiRecs] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<{ label: string; url: string }[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const dark = useTheme();
  const t = getTokens(dark);
  const isDesktop = useIsDesktop();

  // Load Inter font and remove the parent iframe's hard-coded overflow so
  // the page scrolls naturally.
  useEffect(() => {
    const linkId = "inter-font";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
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

  // Deep-link auto-scan (extension's "Open full report" button).
  useEffect(() => {
    if (!initialUrl) return;
    setInput(initialUrl);
    handleScan(null, initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl]);

  function toggleCategory(cat: CategoryKey) {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function handleScan(e: any, urlOverride?: string) {
    if (e) e.preventDefault();
    setError(null);
    setResult(null);
    setApp(null);
    setAiRecs(null);
    setExpandedCats(new Set());

    const source = urlOverride ?? input;
    const parsed = parseAppleUrl(source);
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
      // Default-open the first category that isn't already fully passing,
      // so the most actionable fixes are visible without a click.
      const firstWeak = ORDERED_CATEGORIES.find((c) => scored.categoryScores[c].pct < 80);
      if (firstWeak) setExpandedCats(new Set([firstWeak]));
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
      .filter((c) => c.status !== "pass" && c.fix)
      .map((c) => ({ status: c.status, label: c.label, fix: c.fix }));

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

  const passCount = result ? result.checks.filter((c) => c.status === "pass").length : 0;
  const totalChecks = result ? result.checks.filter((c) => c.status !== "unknown").length : 0;
  const downloadEstimate = app ? estimateDownloads(app) : null;

  const pageWidth = 1200;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: t.bg, color: t.fg, fontFamily: "Inter, system-ui, sans-serif" }}>
      <TopNav t={t} isDesktop={isDesktop} />

      {/* Hero */}
      <section style={{ maxWidth: pageWidth, margin: "0 auto", padding: isDesktop ? "48px 40px 32px" : "32px 20px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, background: t.badgeBg, color: t.badgeFg, fontSize: 12, fontWeight: 600, marginBottom: isDesktop ? 32 : 20 }}>
          <SparkleIcon size={11} />
          ASO Score · Beta
        </div>
        <h1 style={{ fontSize: isDesktop ? 72 : 38, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.025em", margin: "0 0 20px", color: t.fg }}>
          Grade your<br />App Store listing
        </h1>
        <p style={{ fontSize: isDesktop ? 17 : 15, lineHeight: 1.5, color: t.fgMuted, margin: "0 auto 28px", maxWidth: 560 }}>
          Paste an App Store URL. Get a grounded report across 6 ASO categories, plus an AI-written action plan for your team.
        </p>

        {/* Input row */}
        <form onSubmit={handleScan} style={{ position: "relative", maxWidth: 560, margin: "0 auto" }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="https://apps.apple.com/..."
            style={{
              width: "100%",
              height: 54,
              padding: "0 60px 0 22px",
              fontSize: 15,
              fontFamily: "Inter, system-ui, sans-serif",
              borderRadius: 999,
              border: `1px solid ${t.inputBorder}`,
              background: t.inputBg,
              color: t.fg,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            type="submit"
            disabled={loading || !input}
            aria-label="Grade listing"
            style={{
              position: "absolute",
              right: 7, top: 7,
              width: 40, height: 40,
              borderRadius: "50%",
              border: 0,
              background: t.ctaBg, color: t.ctaFg,
              cursor: loading || !input ? "not-allowed" : "pointer",
              opacity: loading || !input ? 0.55 : 1,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {loading ? <LoaderIcon size={15} /> : <ArrowRightIcon size={15} />}
          </button>
        </form>

        {/* TRY chips */}
        {!loading && !result && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: t.fgSubtle, letterSpacing: "0.08em", textTransform: "uppercase" }}>Try</span>
            {TRY_CHIPS.map((chip) => (
              <TryChip
                key={chip.label}
                chip={chip}
                onClick={() => {
                  setInput(chip.url);
                  handleScan(null, chip.url);
                }}
                t={t}
              />
            ))}
          </div>
        )}

        {error && (
          <div style={{ marginTop: 20, fontSize: 14, padding: "10px 16px", borderRadius: 12, display: "inline-block", background: t.errorBg, color: t.errorFg }}>
            {error}
          </div>
        )}
      </section>

      {/* Results */}
      {result && app && (
        <section style={{ maxWidth: pageWidth, margin: "0 auto", padding: isDesktop ? "32px 40px 48px" : "16px 20px 32px" }}>
          <ScoreCard
            app={app}
            result={result}
            downloadEstimate={downloadEstimate}
            passCount={passCount}
            totalChecks={totalChecks}
            isDesktop={isDesktop}
            t={t}
          />

          {/* Per-category accordions */}
          <div style={{ marginTop: 8, padding: "0 4px" }}>
            {ORDERED_CATEGORIES.map((cat) => (
              <CategoryAccordion
                key={cat}
                cat={cat}
                score={result.categoryScores[cat]}
                checks={result.checks.filter((c) => c.cat === cat)}
                open={expandedCats.has(cat)}
                onToggle={() => toggleCategory(cat)}
                t={t}
              />
            ))}
          </div>

          {/* AI plan — restyled to blend with the new card system */}
          <div style={{ marginTop: 32, background: t.cardBg, border: `1px solid ${t.cardBorder}`, borderRadius: 20, padding: isDesktop ? "28px 32px" : 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: t.ctaBg, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  AI action plan
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: t.fg, letterSpacing: "-0.01em" }}>
                  Prioritized fixes for {app.trackName}
                </div>
                <div style={{ fontSize: 13, color: t.fgMuted, marginTop: 4 }}>
                  Grounded in ASO best-practice references.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {aiRecs && (
                  <button onClick={copyRecs} style={{ background: t.shareBtnBg, color: t.shareBtnFg, border: 0, borderRadius: 999, padding: "9px 16px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontFamily: "Inter, system-ui, sans-serif" }}>
                    {copied ? <><SmallCheckIcon size={13} /> Copied</> : <><CopyIcon size={13} /> Copy</>}
                  </button>
                )}
                <button
                  onClick={generateRecommendations}
                  disabled={aiLoading}
                  style={{ background: t.ctaBg, color: t.ctaFg, border: 0, borderRadius: 999, padding: "9px 18px", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 6, cursor: aiLoading ? "not-allowed" : "pointer", opacity: aiLoading ? 0.6 : 1, fontFamily: "Inter, system-ui, sans-serif" }}
                >
                  {aiLoading ? <><LoaderIcon size={13} /> Generating</> : <><SparkleIcon size={12} /> {aiRecs ? "Regenerate plan" : "Generate plan"}</>}
                </button>
              </div>
            </div>

            {!aiRecs && !aiLoading && (
              <div style={{ fontSize: 14, padding: "8px 0 4px", color: t.fgSubtle }}>
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
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${t.cardBorderSoft}` }}>
                    <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.12em", color: t.fgSubtle, marginBottom: 10, fontWeight: 700 }}>
                      Grounded in
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {aiSources.map((s) => (
                        <a key={s.url} href={s.url} target="_blank" rel="noopener" style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: `1px solid ${t.cardBorder}`, color: t.fgMuted, textDecoration: "none" }}>
                          {s.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      <Footer t={t} isDesktop={isDesktop} />

      <style>{`
        @keyframes aso-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}
