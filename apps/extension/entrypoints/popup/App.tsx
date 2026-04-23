// ---------------------------------------------------------------------------
// Popup root.
//
// On mount we:
//   1. Grab the active tab's URL via chrome.tabs.query (requires
//      "activeTab" permission + a user gesture — clicking the icon
//      counts, so this is safe here).
//   2. If it looks like an App Store page, ship a "scan" message to the
//      service worker and await a ScanResponse.
//   3. Render one of four states: not-on-app-store, loading, error, result.
//
// A small "refresh" button bypasses the SW cache (sets `force: true`).
// An "Open full report" button deep-links to the web app with the ID
// and country so the user gets the AI plan + expanded check detail.
// ---------------------------------------------------------------------------

import { useEffect, useMemo, useState } from "react";
import {
  CATEGORIES,
  formatDownloadCount,
  parseAppleUrl,
  type CategoryKey,
} from "@aso/core";
import {
  CategoryRow,
  ScoreRing,
  Spinner,
} from "./components";
import { getTokens, getWebAppUrl, type Theme } from "../../lib/theme";
import type { ScanRequest, ScanResponse } from "../../lib/messages";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "not-on-store" }
  | { kind: "error"; message: string }
  | { kind: "result"; response: Extract<ScanResponse, { ok: true }> };

function useDarkMode() {
  const [dark, setDark] = useState(
    typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return dark;
}

async function activeTabUrl(): Promise<string | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0]?.url ?? null;
}

async function sendScan(req: ScanRequest): Promise<ScanResponse> {
  return chrome.runtime.sendMessage<ScanRequest, ScanResponse>(req);
}

export function App() {
  const dark = useDarkMode();
  const t = getTokens(dark);
  const [state, setState] = useState<State>({ kind: "idle" });
  const [identity, setIdentity] = useState<{ id: string; country: string } | null>(null);
  const [webAppUrl, setWebAppUrl] = useState("");

  useEffect(() => {
    getWebAppUrl().then(setWebAppUrl);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await activeTabUrl();
      if (!url) {
        if (!cancelled) setState({ kind: "not-on-store" });
        return;
      }
      const parsed = parseAppleUrl(url);
      if (!parsed) {
        if (!cancelled) setState({ kind: "not-on-store" });
        return;
      }
      setIdentity(parsed);
      setState({ kind: "loading" });
      const response = await sendScan({ type: "scan", url });
      if (cancelled) return;
      if (response.ok) {
        setState({ kind: "result", response });
      } else {
        setState({ kind: "error", message: response.error });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function refresh() {
    if (!identity) return;
    setState({ kind: "loading" });
    const response = await sendScan({
      type: "scan-id",
      id: identity.id,
      country: identity.country,
      force: true,
    });
    if (response.ok) {
      setState({ kind: "result", response });
    } else {
      setState({ kind: "error", message: response.error });
    }
  }

  return (
    <div
      style={{
        background: t.bg,
        color: t.fg,
        padding: 16,
        minHeight: 120,
        fontSize: 13,
      }}
    >
      <Header t={t} />
      {state.kind === "idle" || state.kind === "loading" ? (
        <LoadingBlock t={t} />
      ) : state.kind === "not-on-store" ? (
        <NotOnStoreBlock t={t} />
      ) : state.kind === "error" ? (
        <ErrorBlock t={t} message={state.message} onRetry={refresh} />
      ) : (
        <ResultBlock
          t={t}
          response={state.response}
          identity={identity}
          webAppUrl={webAppUrl}
          onRefresh={refresh}
        />
      )}
    </div>
  );
}

function Header({ t }: { t: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: 5,
          background: "linear-gradient(135deg,#0090ff,#0d74ce)",
        }}
      />
      <div style={{ fontSize: 12, fontWeight: 600, color: t.fg }}>
        ASO Score
      </div>
      <div
        style={{
          marginLeft: "auto",
          fontSize: 10,
          color: t.fgSubtle,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        Beta
      </div>
    </div>
  );
}

function LoadingBlock({ t }: { t: Theme }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "28px 0",
        justifyContent: "center",
        color: t.fgMuted,
      }}
    >
      <Spinner size={18} t={t} />
      <span style={{ fontSize: 13 }}>Grading this listing…</span>
    </div>
  );
}

function NotOnStoreBlock({ t }: { t: Theme }) {
  return (
    <div style={{ padding: "8px 0" }}>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
        Open an App Store listing
      </div>
      <div style={{ fontSize: 12, color: t.fgMuted, lineHeight: 1.5 }}>
        Navigate to any app page on{" "}
        <code style={{ color: t.fg }}>apps.apple.com</code> and click the
        ASO Score icon again.
      </div>
      <a
        href="https://apps.apple.com/us/app/partiful-party-invite-maker/id1662982304"
        target="_blank"
        rel="noopener"
        style={{
          display: "inline-block",
          marginTop: 12,
          fontSize: 12,
          color: t.blueFg,
          textDecoration: "none",
        }}
      >
        Try it on an example →
      </a>
    </div>
  );
}

function ErrorBlock({
  t,
  message,
  onRetry,
}: {
  t: Theme;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: t.errorBg,
          color: t.errorFg,
          fontSize: 12,
          lineHeight: 1.45,
        }}
      >
        {message}
      </div>
      <button
        onClick={onRetry}
        style={{
          marginTop: 10,
          width: "100%",
          padding: "8px 12px",
          borderRadius: 8,
          border: `1px solid ${t.border}`,
          background: "transparent",
          color: t.fg,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        Try again
      </button>
    </div>
  );
}

function ResultBlock({
  t,
  response,
  identity,
  webAppUrl,
  onRefresh,
}: {
  t: Theme;
  response: Extract<ScanResponse, { ok: true }>;
  identity: { id: string; country: string } | null;
  webAppUrl: string;
  onRefresh: () => void;
}) {
  const { data, fromCache, fetchedAt } = response;
  const { app, score, estimate } = data;
  const rating = app.averageUserRating ?? 0;
  const ratingCount = app.userRatingCount ?? 0;
  const categoryKeys = useMemo(
    () => Object.keys(CATEGORIES) as CategoryKey[],
    [],
  );

  const deepLink =
    identity && webAppUrl
      ? `${webAppUrl}/?id=${encodeURIComponent(identity.id)}&country=${encodeURIComponent(identity.country)}`
      : webAppUrl;

  async function openReport() {
    await chrome.tabs.create({ url: deepLink });
  }

  return (
    <div>
      {/* App identity */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {app.artworkUrl100 ? (
          <img
            src={app.artworkUrl100}
            alt=""
            style={{ width: 36, height: 36, borderRadius: 8 }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "linear-gradient(135deg,#2b7d4e,#0f4e2a)",
            }}
          />
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: t.fg,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {app.trackName}
          </div>
          <div
            style={{
              fontSize: 11,
              color: t.fgMuted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {app.artistName}
            {rating > 0
              ? ` · ${rating.toFixed(1)} ★ · ${ratingCount.toLocaleString()}`
              : ""}
          </div>
        </div>
      </div>

      {/* Score + grade */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "12px 14px",
          border: `1px solid ${t.border}`,
          borderRadius: 12,
          background: t.cardBg,
          marginBottom: 14,
        }}
      >
        <ScoreRing score={score.score} size={80} stroke={7} t={t} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: t.fg }}>
            {score.score >= 80
              ? "Strong"
              : score.score >= 60
                ? "Needs work"
                : "Critical"}
          </div>
          {estimate && (
            <div
              title={`${estimate.method} (${estimate.confidence} confidence)`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 999,
                background: t.blueBg,
                color: t.blueFg,
                fontSize: 11,
                fontWeight: 500,
                marginTop: 6,
              }}
            >
              ≈ {formatDownloadCount(estimate.monthly)} installs/mo
            </div>
          )}
          <div
            style={{
              fontSize: 10,
              color: t.fgSubtle,
              marginTop: 6,
            }}
          >
            {fromCache ? "Cached" : "Fresh"} · {formatAgo(fetchedAt)}
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div style={{ marginBottom: 14 }}>
        {categoryKeys.map((k) => (
          <CategoryRow
            key={k}
            label={CATEGORIES[k].label}
            score={score.categoryScores[k]}
            t={t}
          />
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={openReport}
          style={{
            flex: 1,
            height: 34,
            borderRadius: 8,
            border: 0,
            background: t.btnBg,
            color: t.btnFg,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          Open full report →
        </button>
        <button
          onClick={onRefresh}
          title="Bypass cache and rescan"
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            border: `1px solid ${t.border}`,
            background: "transparent",
            color: t.fgMuted,
            fontSize: 14,
          }}
          aria-label="Refresh"
        >
          ↻
        </button>
      </div>

      {app.dataWarnings.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: "8px 10px",
            border: `1px solid ${t.border}`,
            borderRadius: 8,
            fontSize: 10,
            color: t.fgSubtle,
            lineHeight: 1.5,
          }}
        >
          {app.dataWarnings[0]}
        </div>
      )}
    </div>
  );
}

function formatAgo(ts: number): string {
  const ms = Date.now() - ts;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  return `${h}h ago`;
}
