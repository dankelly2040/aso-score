// ---------------------------------------------------------------------------
// Home route.
//
// Reads `?id=...&country=...` from the URL (set by the Chrome extension's
// deep-link) and passes it through to the DOM component so the app
// auto-scans on first paint. If no query params are present, the component
// opens in its idle state and the user types a URL manually.
// ---------------------------------------------------------------------------

import { useEffect, useState } from "react";
import { View } from "react-native";
import ASOScoreDOM from "../components/ASOScoreDOM";

export default function Home() {
  const [initialUrl, setInitialUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const country = (params.get("country") || "us").toLowerCase();
    if (id && /^\d+$/.test(id)) {
      setInitialUrl(
        `https://apps.apple.com/${country}/app/id${id}`,
      );
    }
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ASOScoreDOM
        initialUrl={initialUrl}
        dom={{ style: { flex: 1, width: "100%", height: "100%" } }}
      />
    </View>
  );
}
