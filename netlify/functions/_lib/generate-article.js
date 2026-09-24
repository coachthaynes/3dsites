const Anthropic = require("@anthropic-ai/sdk");

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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const statsSummary = buildStatsSummary(player);
  const externalNote = externalStats
    ? `\nAdditional stats pulled from her MaxPreps page (source: ${externalStats.source}): ${JSON.stringify(externalStats)}`
    : "";

  if (!statsSummary && !externalStats) {
    throw new Error("No stats on file for this player yet, add season stats before generating an article");
  }

  const client = new Anthropic({ apiKey });

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

  const response = await client.messages.create({
    model: "claude-opus-5",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const raw = textBlock ? textBlock.text.trim() : "";

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
