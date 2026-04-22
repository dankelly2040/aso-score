interface ITunesResult {
  trackName?: string;
  artistName?: string;
  description?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  currentVersionReleaseDate?: string;
  releaseNotes?: string;
  languageCodesISO2A?: string[];
  primaryGenreName?: string;
  artworkUrl100?: string;
  artworkUrl512?: string;
  trackId?: number;
}

interface MediaShelfSummary {
  subtitle: string | null;
  iphoneScreenshotCount: number | null;
  ipadScreenshotCount: number | null;
  hasPreviewVideo: boolean | null;
  htmlParseError?: string;
}

export interface AppData extends ITunesResult {
  subtitle: string | null;
  iphoneScreenshotCount: number | null;
  ipadScreenshotCount: number | null;
  hasPreviewVideo: boolean | null;
  dataWarnings: string[];
}

async function fetchITunes(id: string, country: string): Promise<ITunesResult> {
  const url = `https://itunes.apple.com/lookup?id=${id}&country=${country}&entity=software`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes lookup failed: ${res.status}`);
  const data: { resultCount: number; results: ITunesResult[] } = await res.json();
  if (!data.results || data.results.length === 0) {
    throw new Error("App not found. Double-check the URL or ID.");
  }
  return data.results[0];
}

async function fetchAppStoreHTML(id: string, country: string): Promise<MediaShelfSummary> {
  const slug = "app";
  const url = `https://apps.apple.com/${country}/${slug}/id${id}`;
  const empty: MediaShelfSummary = {
    subtitle: null,
    iphoneScreenshotCount: null,
    ipadScreenshotCount: null,
    hasPreviewVideo: null,
  };

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) {
      return { ...empty, htmlParseError: `HTML fetch failed: ${res.status}` };
    }
    const html = await res.text();
    const blobMatch = html.match(
      /<script[^>]+id="serialized-server-data"[^>]*>([\s\S]*?)<\/script>/
    );
    if (!blobMatch) {
      return { ...empty, htmlParseError: "Embedded app data blob not found." };
    }
    const parsed = JSON.parse(blobMatch[1]);
    const d0 = parsed?.data?.[0]?.data;
    if (!d0) {
      return { ...empty, htmlParseError: "Unexpected data blob shape." };
    }

    const subtitle: string | null = d0?.lockup?.subtitle ?? null;

    const phoneItems: any[] = d0?.shelfMapping?.product_media_phone_?.items ?? [];
    const padItems: any[] = d0?.shelfMapping?.product_media_pad_?.items ?? [];

    const iphoneScreenshotCount = phoneItems.filter((it) => it?.screenshot).length;
    const ipadScreenshotCount = padItems.filter((it) => it?.screenshot).length;
    const hasPreviewVideo = [...phoneItems, ...padItems].some((it) => it?.video);

    return {
      subtitle,
      iphoneScreenshotCount,
      ipadScreenshotCount,
      hasPreviewVideo,
    };
  } catch (err: any) {
    return { ...empty, htmlParseError: err?.message || "HTML parse error" };
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const country = (url.searchParams.get("country") || "us").toLowerCase();

  if (!id || !/^\d+$/.test(id)) {
    return Response.json({ error: "Provide a numeric 'id' query param." }, { status: 400 });
  }

  let itunes: ITunesResult;
  try {
    itunes = await fetchITunes(id, country);
  } catch (err: any) {
    return Response.json({ error: err.message || "Lookup failed" }, { status: 404 });
  }

  const media = await fetchAppStoreHTML(id, country);

  const warnings: string[] = [];
  if (media.htmlParseError) {
    warnings.push(
      `Could not scrape App Store page (${media.htmlParseError}). Subtitle and visual asset checks may be inaccurate.`
    );
  }

  const payload: AppData = {
    ...itunes,
    subtitle: media.subtitle,
    iphoneScreenshotCount: media.iphoneScreenshotCount,
    ipadScreenshotCount: media.ipadScreenshotCount,
    hasPreviewVideo: media.hasPreviewVideo,
    dataWarnings: warnings,
  };

  return Response.json(payload);
}
