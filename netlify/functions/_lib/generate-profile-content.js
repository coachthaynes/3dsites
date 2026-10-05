// Auto-fills the "Illumination Extras" bio copy (about paragraphs, tags,
// skill highlights) for a player, using Gemini. Grounded in whatever is
// already on file (stats, accolades, writeups the coach typed in) plus,
// optionally, Gemini's own Google Search tool so it can find real published
// coverage of her by name without this codebase ever having to guess a URL
// or hold a separate search API key. Same "never invent a fact" rule as the
// article generator in generate-article.js, since this text goes straight
// onto a real player's public recruiting page.
const { buildStatsSummary } = require("./generate-article");

// gemini-2.0-flash was retired by Google; its own 404 response named
// gemini-3.8-flash as the replacement, which is why that's the default here.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

function buildFactsBlock(player, externalStats) {
  const lines = [];
  const stats = buildStatsSummary(player);
  if (stats) lines.push(stats);
  if (externalStats) {
    const seasons = Array.isArray(externalStats) ? externalStats : [externalStats];
    for (const s of seasons) {
      lines.push(`MaxPreps season on record (source: ${s.source || "maxpreps"}): ${JSON.stringify(s)}`);
    }
  }
  if (player.message) lines.push(`Accolades and awards on file: ${player.message}`);
  if (player.currentOffers) lines.push(`Current college interest / offers: ${player.currentOffers}`);
  if (Array.isArray(player.writeups)) {
    for (const w of player.writeups) {
      if (!w || !w.title) continue;
      const bits = [w.title];
      if (w.source) bits.push(`(${w.source})`);
      const snippet = w.excerpt || (w.body ? String(w.body).slice(0, 300) : "");
      if (snippet) bits.push(`- "${snippet}"`);
      lines.push(`Writeup already on file: ${bits.join(" ")}`);
    }
  }
  return lines.join("\n");
}

async function generateProfileContent(player, options) {
  const { externalStats, useWebSearch } = options || {};
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const factsBlock = buildFactsBlock(player, externalStats);
  if (!factsBlock && !useWebSearch) {
    throw new Error("No stats, accolades, or writeups on file yet, add some first or turn on web search");
  }

  const prompt = `You are writing recruiting profile copy for a girls high school basketball player's personal website. Every fact you use must be real and verifiable. Never invent stats, quotes, awards, games, or any detail that isn't given to you below or confirmed by a genuine source about this specific person.

Player: ${player.playerName || "not listed"}
High School: ${player.highSchool || "not listed"}
Position: ${player.position || "not listed"}
Class of: ${player.gradYear || "not listed"}

Known facts on file:
${factsBlock || "(none on file yet)"}

${useWebSearch
  ? "Use web search to find real, published coverage of THIS specific player. Match her full name together with her high school and class year, since names can belong to more than one person; if a search result cannot be confidently confirmed as the same person, ignore it entirely rather than guessing."
  : "Do not search the web. Use only the facts given above."}

Write:
1. aboutParagraph1: a short paragraph, two to four sentences, introducing her as a player, grounded only in confirmed facts.
2. aboutParagraph2: a short paragraph, two to four sentences, about her character, work ethic, or recruiting interest, same grounding rule.
3. tag1, tag2, tag3: three short punchy tags, two to four words each, describing her playing style or identity, for example "Three And D" or "Floor General".
4. skill1Title and skill1Body: a short skill highlight, title one or two words like "Identity", body one sentence.
5. skill2Title and skill2Body: a second, different skill highlight, title like "Signature", body one sentence.

If there is genuinely not enough information to write something specific and factual, write something modest and general instead of inventing details. Do not use any hyphens or em dashes anywhere in your response.

Respond with ONLY a JSON object, no markdown fences, no extra text, in exactly this shape:
{"aboutParagraph1":"...","aboutParagraph2":"...","tag1":"...","tag2":"...","tag3":"...","skill1Title":"...","skill1Body":"...","skill2Title":"...","skill2Body":"..."}`;

  const requestBody = { contents: [{ parts: [{ text: prompt }] }] };
  if (useWebSearch) requestBody.tools = [{ google_search: {} }];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errText.slice(0, 300)}`);
  }

  const data = await res.json();
  const candidate = data && data.candidates && data.candidates[0];
  const raw = (
    (candidate &&
      candidate.content &&
      candidate.content.parts &&
      candidate.content.parts[0] &&
      candidate.content.parts[0].text) ||
    ""
  ).trim().replace(/^```json\s*|```$/g, "").trim();

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error("Gemini did not return usable JSON, try again");
  }

  // Grounding chunks are the actual search results Gemini used, returned by
  // the API itself rather than written by the model, so they are real URLs
  // rather than something the model could hallucinate.
  const groundingChunks = (candidate && candidate.groundingMetadata && candidate.groundingMetadata.groundingChunks) || [];
  const sources = groundingChunks
    .map((c) => (c && c.web && c.web.uri ? { uri: c.web.uri, title: c.web.title || c.web.uri } : null))
    .filter(Boolean);

  return {
    aboutParagraph1: parsed.aboutParagraph1 || "",
    aboutParagraph2: parsed.aboutParagraph2 || "",
    tag1: parsed.tag1 || "",
    tag2: parsed.tag2 || "",
    tag3: parsed.tag3 || "",
    skill1Title: parsed.skill1Title || "",
    skill1Body: parsed.skill1Body || "",
    skill2Title: parsed.skill2Title || "",
    skill2Body: parsed.skill2Body || "",
    sources,
    factsUsed: factsBlock,
  };
}

module.exports = { generateProfileContent, buildFactsBlock };
