// ---------------------------------------------------------------------------
// Tiny popup-sized visual primitives.
// Equivalent components live (bigger) in the web app's ASOScoreDOM.tsx;
// keeping them independent here avoids forcing "use dom" semantics into
// the extension and keeps the popup bundle small.
// ---------------------------------------------------------------------------

import type { Theme } from "../../lib/theme";
import type { CategoryScore } from "@aso/core";

export function ScoreRing({
  score,
  size = 96,
  stroke = 8,
  t,
}: {
  score: number;
  size?: number;
  stroke?: number;
  t: Theme;
}) {
  const r = (size - stroke) / 2 - 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  const color = score >= 80 ? t.green : score >= 60 ? t.amber : t.red;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={t.borderSoft}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition:
              "stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            fontSize: size * 0.34,
            fontWeight: 700,
            color: t.fg,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 10, color: t.fgMuted, marginTop: 2 }}>
          / 100
        </div>
      </div>
    </div>
  );
}

export function CategoryRow({
  label,
  score,
  t,
}: {
  label: string;
  score: CategoryScore;
  t: Theme;
}) {
  const color =
    score.pct >= 80 ? t.green : score.pct >= 50 ? t.amber : t.red;
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
          fontSize: 11,
        }}
      >
        <span style={{ color: t.fg, fontWeight: 500 }}>{label}</span>
        <span
          style={{
            color: t.fgMuted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score.pct}%
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: t.borderSoft,
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score.pct}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}

export function Spinner({ size = 20, t }: { size?: number; t: Theme }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={t.fgMuted}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ animation: "aso-spin 1s linear infinite" }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
