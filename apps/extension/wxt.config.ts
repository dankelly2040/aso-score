// ---------------------------------------------------------------------------
// WXT config.
//
// WXT is a Vite-based framework for browser extensions — file-based
// entrypoints in ./entrypoints, auto-generated manifest, HMR on both
// popup and service worker. It plays well with React via the official
// @wxt-dev/module-react plugin.
//
// Key choices:
//   - manifestVersion 3 only (Chrome Web Store no longer accepts MV2).
//   - host_permissions cover both iTunes Lookup and the HTML page we
//     scrape. Without apps.apple.com in this list, the SW's fetch() is
//     blocked by CORS despite service workers normally being "no-cors".
//   - action.default_popup is set implicitly by the popup entrypoint.
//   - We keep permissions minimal: `storage` for the session cache + user
//     prefs, `activeTab` to read the current tab's URL from the popup.
//     No `tabs` (broad read of every tab), no content scripts (not needed
//     for the icon-click popup flow).
// ---------------------------------------------------------------------------

import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  srcDir: ".",
  manifest: {
    name: "ASO Score — App Store Audit",
    description:
      "Grade any iOS App Store listing across 6 ASO categories in one click.",
    version: "0.0.1",
    permissions: ["storage", "activeTab"],
    host_permissions: [
      "https://apps.apple.com/*",
      "https://itunes.apple.com/*",
    ],
    action: {
      default_title: "Grade this App Store listing",
    },
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
  },
});
