// ---------------------------------------------------------------------------
// Popup design tokens. Mirrors the web app's palette so a user who scans
// an app in the extension and then clicks through to the full report
// feels no visual hand-off.
// ---------------------------------------------------------------------------

export type Theme = ReturnType<typeof getTokens>;

export function getTokens(dark: boolean) {
  return {
    bg: dark ? "#0e0e0e" : "#ffffff",
    cardBg: dark ? "#1a1a1a" : "#fafafa",
    border: dark ? "#2a2a2a" : "#e0e0e0",
    borderSoft: dark ? "#1f1f1f" : "#f0f0f0",
    fg: dark ? "#eeeeee" : "#202020",
    fgMuted: dark ? "#b4b4b4" : "#646464",
    fgSubtle: dark ? "#7b7b7b" : "#838383",
    blueBg: dark ? "#0d2847" : "#e6f4fe",
    blueFg: dark ? "#70b8ff" : "#0d74ce",
    btnBg: dark ? "#fff" : "#0090ff",
    btnFg: dark ? "#202020" : "#ffffff",
    errorBg: dark ? "#2a1618" : "#fef2f2",
    errorFg: dark ? "#ff8b8b" : "#dc2626",
    green: "#30a46c",
    amber: "#ffba18",
    red: "#e5484d",
    gray: "#8d8d8d",
  };
}

/**
 * Where the popup deep-links "Open full report" to. Defaults to prod,
 * but power users can override via `chrome.storage.local` for local dev:
 *
 *   chrome.storage.local.set({ webAppUrl: "http://localhost:8081" })
 */
export const DEFAULT_WEB_APP_URL = "https://aso-score.expo.app";

export async function getWebAppUrl(): Promise<string> {
  const { webAppUrl } = await chrome.storage.local.get("webAppUrl");
  if (typeof webAppUrl === "string" && webAppUrl.length > 0) return webAppUrl;
  return DEFAULT_WEB_APP_URL;
}
