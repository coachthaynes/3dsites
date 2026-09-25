// Uses Google Gemini's free tier (no Anthropic dependency). The exact
// REST shape below is the long-standing Generative Language API
// contract, but it hasn't been verified live from this environment (no
// outbound network access here), so the first real generation should be
// treated as the actual test of this integration.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function buildStatsSummary(p) {
  const lines = [];
  const seasons = ["Freshman", "Sophomore", "Junior", "Senior"];
  for (const season of seasons) {
    const ppg = p[`stat${season}PPG`];
    const reb = p[`stat${season}Rebounds`];
    const stl = p[`stat${season}Steals`];
    const blk = p[`stat${season}Blocks`];
    const ast = p[`stat${season}Assists`];
    const pts = p[`stat${season}TotalPoints`];
    if ([ppg, reb, stl, blk, ast, pts].some(Boolean)) {
      lines.push(
        `${season} season: ${ppg || "?"} PPG, ${reb || "?"} rebounds, ${stl || "?"} steals, ${blk || "?"} blocks, ${ast || "?"} assists, ${pts || "?"} total points.`
      );
    }
  }
  if (p.currentOffers) lines.push(`Current college interest / offers: ${p.currentOffers}.`);
  return lines.join("\n");
}

async function generateArticle(player, externalStats) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const statsSummary = buildStatsSummary(player);
  const externalNote = externalStats
    ? `\nAdditional stats pulled from her MaxPreps page (source: ${externalStats.source}): ${JSON.stringify(externalStats)}`
    : "";

  if (!statsSummary && !externalStats) {
    throw new Error("No stats on file for this player yet, add season stats before generating an article");
  }

  const prompt = `Write a short, upbeat high school girls basketball recap article for a player recruiting website, in the style of a local sports section (2-3 short paragraphs, energetic but factual, no invented stats or games).

Player: ${player.playerName}
High School: ${player.highSchool || "not listed"}
Position: ${player.position || "not listed"}
Class of: ${player.gradYear || "not listed"}

Known stats:
${statsSummary || "(none on file)"}${externalNote}

Only use the numbers given above, never invent stats, scores, or specific games that aren't provided. If stats are sparse, focus the article on her recruiting profile and potential instead of padding with invented details.

Respond with ONLY a JSON object, no markdown fences, no extra text, in exactly this shape:
{"headline": "short punchy headline", "body": "the article body as 2-3 paragraphs separated by \\n\\n"}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = (
    data &&
    data.candidates &&
    data.candidates[0] &&
    data.candidates[0].content &&
    data.candidates[0].content.parts &&
    data.candidates[0].content.parts[0] &&
    data.candidates[0].content.parts[0].text
  || "").trim().replace(/^```json\s*|```$/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // model didn't return clean JSON; fall back to treating the whole
    // response as the body with a generic headline rather than failing
    parsed = { headline: `${player.playerName} Update`, body: raw };
  }

  return {
    headline: parsed.headline || `${player.playerName} Update`,
    body: parsed.body || raw,
    statsUsed: { onFile: statsSummary, external: externalStats || null },
  };
}

module.exports = { generateArticle, buildStatsSummary };
