import { ASO_KNOWLEDGE } from "../../lib/aso-knowledge";

interface AppSummary {
  trackName?: string;
  artistName?: string;
  averageUserRating?: number;
  userRatingCount?: number;
  primaryGenreName?: string;
}

interface FailedCheck {
  status: string;
  label: string;
  fix: string;
}

interface RequestBody {
  app?: AppSummary;
  failedChecks?: FailedCheck[];
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { app, failedChecks } = body;
  if (!app || !Array.isArray(failedChecks)) {
    return Response.json(
      { error: "Missing 'app' or 'failedChecks' in body." },
      { status: 400 }
    );
  }

  const system = `You are an App Store Optimization (ASO) expert. Ground every recommendation in the reference knowledge below. When a recommendation maps directly to a rule from the reference, cite it inline in parentheses (e.g. "(per Eronred/aso-skills: title formula)"). Do not invent stats — if you don't know a number from the knowledge, don't fabricate one.

<reference_knowledge>
${ASO_KNOWLEDGE}
</reference_knowledge>`;

  const failedChecksText = failedChecks
    .map((c) => `- [${c.status.toUpperCase()}] ${c.label}: ${c.fix}`)
    .join("\n");

  const userMessage = `Report for the iOS app "${app.trackName}" by ${app.artistName}.

Current title: "${app.trackName}"
Current rating: ${app.averageUserRating ?? "N/A"} (${app.userRatingCount ?? 0} ratings)
Category: ${app.primaryGenreName ?? "Unknown"}

Issues found by the automated checks:
${failedChecksText}

Write a prioritized action plan in markdown. For each issue:
1. State the specific problem in one sentence.
2. Give concrete copy/asset suggestions (actual example text when relevant).
3. Cite the reference rule(s) that back the recommendation.
4. Explain the expected impact.

Organize fixes by: Quick wins (today), High-impact changes (this week), Strategic (this month). Start directly with the plan — no preamble.`;

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  const data = await upstream.json();
  if (!upstream.ok) {
    return Response.json(
      { error: data?.error?.message || "Upstream error", status: upstream.status },
      { status: upstream.status }
    );
  }

  const text = Array.isArray(data.content)
    ? data.content.map((b: any) => b.text || "").filter(Boolean).join("\n")
    : "";

  return Response.json({
    text,
    sources: [
      { label: "Eronred/aso-skills (MIT)", url: "https://github.com/Eronred/aso-skills" },
      { label: "Adjust ASO guide", url: "https://www.adjust.com/resources/guides/app-store-optimization/" },
    ],
  });
}
