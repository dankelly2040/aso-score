// ---------------------------------------------------------------------------
// Popup root — placeholder.
//
// The real popup UI (score ring, category bars, deep-link button) lands
// in the next commit. Right now this just confirms that:
//   - WXT can build React + TypeScript + tsx together,
//   - the popup can import from @aso/core via the workspace link,
//   - MV3 loads the assembled .output/chrome-mv3 bundle.
// ---------------------------------------------------------------------------

import { parseAppleUrl } from "@aso/core";

export function App() {
  return (
    <main
      style={{
        width: 340,
        padding: 16,
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        fontSize: 13,
        lineHeight: 1.4,
      }}
    >
      <h1 style={{ fontSize: 16, margin: "0 0 8px" }}>ASO Score</h1>
      <p style={{ margin: 0, color: "#666" }}>
        Extension scaffold ready. Open an App Store listing and click the
        icon again — scan logic lands in the next commit.
      </p>
      <p style={{ marginTop: 12, fontSize: 11, color: "#999" }}>
        Probe: <code>parseAppleUrl</code> is{" "}
        {typeof parseAppleUrl === "function" ? "loaded" : "MISSING"}.
      </p>
    </main>
  );
}
