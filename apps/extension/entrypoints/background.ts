// ---------------------------------------------------------------------------
// MV3 service worker — placeholder.
//
// The real scanning logic (fetch app data, score it, cache the result in
// chrome.storage.session, respond to popup messages) lands in the next
// commit. This stub is here so WXT has a valid background entrypoint and
// the extension loads in developer mode.
// ---------------------------------------------------------------------------

export default defineBackground(() => {
  // eslint-disable-next-line no-console
  console.log("[ASO Score] background worker ready");
});
