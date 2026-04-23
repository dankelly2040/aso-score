// ---------------------------------------------------------------------------
// /api/fetch-app
//
// Thin wrapper over `fetchAppData` from @aso/core — the same function the
// Chrome extension's service worker calls directly. Keeping the scraping
// logic in one place means web and extension can't drift apart.
// ---------------------------------------------------------------------------

import { fetchAppData } from "@aso/core";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const country = (url.searchParams.get("country") || "us").toLowerCase();

  if (!id || !/^\d+$/.test(id)) {
    return Response.json(
      { error: "Provide a numeric 'id' query param." },
      { status: 400 },
    );
  }

  try {
    const payload = await fetchAppData(id, country);
    return Response.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    return Response.json({ error: message }, { status: 404 });
  }
}
