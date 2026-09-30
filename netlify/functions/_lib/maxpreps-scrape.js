// Best-effort MaxPreps stat scrape. This is genuinely experimental: we have
// no way to verify MaxPreps' live page structure while building this (no
// outbound access from the dev environment), and many stat sites render
// their numbers client-side with JavaScript that a plain server-side fetch
// never sees. Every code path here is defensive on purpose, returning null
// on anything unexpected so the caller always has a safe fallback to the
// player's own on-file stats rather than surfacing a scrape error.

const cheerio = require("cheerio");

async function fetchMaxPrepsStats(maxprepsUrl) {
  if (!maxprepsUrl) return null;

  let html;
  try {
    const res = await fetch(maxprepsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElevateHerHoopsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch (e) {
    return null; // network error, timeout, or blocked request - fall back silently
  }

  try {
    const $ = cheerio.load(html);

    // Strategy 1: many modern sites embed structured JSON in a script tag
    // (Next.js __NEXT_DATA__, JSON-LD, etc). Look for anything that smells
    // like a stat line before falling back to visible text.
    let statsFromJson = null;
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (statsFromJson) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findStatsInObject(parsed);
        if (found) statsFromJson = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    if (statsFromJson) {
      return { source: "maxpreps-json", ...statsFromJson };
    }

    // Strategy 2: fall back to scanning visible text for "12.4 PPG"-style
    // patterns. Low confidence, but better than nothing when a page happens
    // to be server-rendered.
    const bodyText = $("body").text().replace(/\s+/g, " ");
    const ppgMatch = bodyText.match(/([\d.]+)\s*PPG/i);
    const rebMatch = bodyText.match(/([\d.]+)\s*(?:RPG|Rebounds)/i);
    const astMatch = bodyText.match(/([\d.]+)\s*(?:APG|Assists)/i);
    if (ppgMatch || rebMatch || astMatch) {
      return {
        source: "maxpreps-text",
        ppg: ppgMatch ? ppgMatch[1] : null,
        rebounds: rebMatch ? rebMatch[1] : null,
        assists: astMatch ? astMatch[1] : null,
      };
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Best-effort MaxPreps schedule pull. Same caveats as the stats scraper
// above: schedule tables are usually rendered client side with JavaScript,
// so a plain server side fetch only sees this when the page happens to
// embed the schedule as structured JSON. Returns [] on anything unexpected,
// never throws, and the admin always reviews and edits the result before
// it is saved, so a wrong or partial guess here is never published as is.
async function fetchMaxPrepsSchedule(maxprepsUrl) {
  if (!maxprepsUrl) return [];

  let html;
  try {
    const res = await fetch(maxprepsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ElevateHerHoopsBot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    html = await res.text();
  } catch (e) {
    return [];
  }

  try {
    const $ = cheerio.load(html);
    let games = [];
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (games.length) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findScheduleInObject(parsed);
        if (found && found.length) games = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    return games;
  } catch (e) {
    return [];
  }
}

// Looks for an array of objects that plausibly describe games (something
// date-like plus something opponent-like), and maps whatever it can onto
// the same shape the admin dashboard's schedule rows use. Fields it can't
// confidently map are left blank for the admin to fill in.
function findScheduleInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  if (Array.isArray(obj) && obj.length >= 2) {
    const mapped = obj.map(mapGameCandidate).filter(Boolean);
    if (mapped.length >= 2) return mapped;
  }
  for (const k of Object.keys(obj)) {
    const child = obj[k];
    if (child && typeof child === "object") {
      const found = findScheduleInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

const DATE_KEY = /^(date|game.?date|eventdate|startdate)$/i;
const OPP_KEY = /^(opponent|opp|opponentname|vs|team)$/i;
const LOC_KEY = /^(location|loc|homeaway|site)$/i;
const TIME_KEY = /^(time|starttime|gametime)$/i;
const RESULT_KEY = /^(result|score|outcome)$/i;

function mapGameCandidate(item) {
  if (!item || typeof item !== "object") return null;
  const keys = Object.keys(item);
  const dateKey = keys.find((k) => DATE_KEY.test(k));
  const oppKey = keys.find((k) => OPP_KEY.test(k));
  if (!dateKey || !oppKey) return null;
  const rawDate = String(item[dateKey]);
  const parsed = new Date(rawDate);
  if (isNaN(parsed.getTime())) return null;
  const iso = parsed.toISOString().slice(0, 10);
  const locKey = keys.find((k) => LOC_KEY.test(k));
  const timeKey = keys.find((k) => TIME_KEY.test(k));
  const resultKey = keys.find((k) => RESULT_KEY.test(k));
  const rawLoc = locKey ? String(item[locKey]).toLowerCase() : "";
  const loc = rawLoc.includes("home") ? "Home" : rawLoc.includes("away") ? "Away" : "TBD";
  return {
    date: iso,
    opp: String(item[oppKey] || "").trim(),
    loc,
    time: timeKey ? String(item[timeKey]) : "TBD",
    note: "",
    tag: "",
    result: resultKey ? String(item[resultKey]) : "",
  };
}

function findStatsInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  const keys = Object.keys(obj);
  const statKeyPattern = /ppg|points.?per.?game|rebounds|assists|steals|blocks/i;
  if (keys.some((k) => statKeyPattern.test(k))) {
    const out = {};
    for (const k of keys) {
      if (statKeyPattern.test(k) && (typeof obj[k] === "number" || typeof obj[k] === "string")) {
        out[k] = obj[k];
      }
    }
    if (Object.keys(out).length > 0) return out;
  }
  for (const k of keys) {
    const child = obj[k];
    if (child && typeof child === "object") {
      const found = findStatsInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

module.exports = { fetchMaxPrepsStats, fetchMaxPrepsSchedule };
