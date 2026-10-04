// Best-effort MaxPreps stat scrape. This is genuinely experimental: we have
// no way to verify MaxPreps' live page structure while building this (no
// outbound access from the dev environment), and many stat sites render
// their numbers client-side with JavaScript that a plain server-side fetch
// never sees. Every code path here is defensive on purpose, returning null
// on anything unexpected so the caller always has a safe fallback to the
// player's own on-file stats rather than surfacing a scrape error.

const cheerio = require("cheerio");

// Many players on this site play more than one sport, and MaxPreps profiles
// can bundle several sports together. These help both scrape strategies stay
// on her basketball numbers and skip past another sport's stat block.
const BASKETBALL_PATTERN = /basketball|bball/i;
const OTHER_SPORT_PATTERN = /\b(volleyball|soccer|track|cross.?country|softball|baseball|football|golf|tennis|swim(?:ming)?|wrestling|lacrosse|field hockey|gymnastics|cheer(?:leading)?)\b/i;
const SPORT_KEY = /^sport$|^sportname$|^sportslug$|^sporttype$/i;

function objectSportTag(obj) {
  for (const k of Object.keys(obj)) {
    if (SPORT_KEY.test(k) && typeof obj[k] === "string") return obj[k];
  }
  return null;
}

function isOtherSportTag(tag) {
  return Boolean(tag) && OTHER_SPORT_PATTERN.test(tag) && !BASKETBALL_PATTERN.test(tag);
}

// cheerio's plain .text() runs adjacent block elements together with no
// space ("...APGVolleyball..."), which can quietly merge two words into one
// and break \b word boundary matching across element edges. Spacing out
// block-level elements first keeps every word intact.
function extractSpacedText($) {
  $("div, p, li, tr, td, th, br, h1, h2, h3, h4, h5, h6").after(" ");
  return $("body").text().replace(/\s+/g, " ").trim();
}

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
    const bodyText = extractSpacedText($);
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

// Best-effort MaxPreps CAREER stats pull: every season it can find, not
// just the most recent one. Same caveats as the single-season scrape above,
// just applied per season instead of once.
async function fetchMaxPrepsCareerStats(maxprepsUrl) {
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

    // Strategy 1: an array of per-season objects embedded as structured JSON.
    let seasons = [];
    $('script[type="application/json"], script#__NEXT_DATA__, script[type="application/ld+json"]').each((_, el) => {
      if (seasons.length) return;
      try {
        const parsed = JSON.parse($(el).contents().text());
        const found = findCareerStatsInObject(parsed);
        if (found && found.length) seasons = found;
      } catch (e) {
        // not parseable JSON, or not the shape we're looking for; keep scanning
      }
    });
    if (seasons.length) {
      return seasons.map((s) => ({ source: "maxpreps-json", ...s }));
    }

    // Strategy 2: scan visible text for every "12.4 PPG" occurrence. Rebounds
    // and assists are expected to follow PPG within the same season's stat
    // line, so that search only looks forward, up to wherever the next
    // season's own PPG match starts, never past it. The label is expected to
    // come before PPG, so that search only looks backward, taking the
    // closest grade or year word it finds. Keeping each search one-directional
    // like this is what stops two seasons sitting close together in the text
    // from bleeding into each other's numbers.
    const bodyText = extractSpacedText($);
    const ppgMatches = [...bodyText.matchAll(/([\d.]+)\s*PPG/gi)].slice(0, 10);
    ppgMatches.forEach((match, i) => {
      const prev = ppgMatches[i - 1];
      const next = ppgMatches[i + 1];
      const backward = prev ? prev.index + prev[0].length : Math.max(0, match.index - 60);
      const forward = next ? next.index : Math.min(bodyText.length, match.index + 120);

      // Whichever sport name sits closest before this stat line, basketball or
      // something else, is the sport it belongs to. A wider window than the
      // label search above since a sport name is more likely to be a distant
      // section heading than something sitting right next to the number.
      const sportScanStart = prev ? prev.index + prev[0].length : Math.max(0, match.index - 400);
      const sportWindow = bodyText.slice(sportScanStart, match.index);
      const lastBasketballIdx = [...sportWindow.matchAll(new RegExp(BASKETBALL_PATTERN.source, "gi"))].map((m) => m.index).pop();
      const lastOtherSportIdx = [...sportWindow.matchAll(new RegExp(OTHER_SPORT_PATTERN.source, "gi"))].map((m) => m.index).pop();
      if (lastOtherSportIdx !== undefined && (lastBasketballIdx === undefined || lastOtherSportIdx > lastBasketballIdx)) {
        return; // the closest sport mention before this stat line is not basketball, skip it
      }

      const statsWindow = bodyText.slice(match.index, forward);
      const rebMatch = statsWindow.match(/([\d.]+)\s*(?:RPG|Rebounds)/i);
      const astMatch = statsWindow.match(/([\d.]+)\s*(?:APG|Assists)/i);
      const labelMatches = [...bodyText.slice(backward, match.index).matchAll(/(Freshman|Sophomore|Junior|Senior|20\d\d-\d\d|20\d\d)/gi)];
      const label = labelMatches.length ? labelMatches[labelMatches.length - 1][1] : null;
      seasons.push({
        source: "maxpreps-text",
        label,
        ppg: match[1],
        rebounds: rebMatch ? rebMatch[1] : null,
        assists: astMatch ? astMatch[1] : null,
      });
    });
    return seasons;
  } catch (e) {
    return [];
  }
}

const LABEL_KEY = /^(season|seasonname|year|grade|gradelevel|class|classyear|level)$/i;
const STAT_KEY_PATTERN = /ppg|points.?per.?game|rebounds|assists|steals|blocks/i;
const TOTAL_POINTS_KEY = /total.?points|points.?scored/i;

function mapSeasonCandidate(item) {
  if (!item || typeof item !== "object") return null;
  const keys = Object.keys(item);
  const out = {};
  let labelKey = keys.find((k) => LABEL_KEY.test(k));
  for (const k of keys) {
    const v = item[k];
    if (typeof v !== "number" && typeof v !== "string") continue;
    if (TOTAL_POINTS_KEY.test(k)) out.totalPoints = v;
    else if (STAT_KEY_PATTERN.test(k)) out[k] = v;
  }
  if (Object.keys(out).length === 0) return null;
  out.label = labelKey ? String(item[labelKey]) : null;
  return out;
}

// Looks for an array where multiple elements each look like a season's worth
// of stats, rather than stopping at the first matching object the way the
// single-season scrape above does.
function findCareerStatsInObject(obj, depth) {
  if (!obj || typeof obj !== "object" || depth > 6) return null;
  if (Array.isArray(obj) && obj.length >= 2) {
    const mapped = obj.map(mapSeasonCandidate).filter(Boolean);
    if (mapped.length >= 2) return mapped;
  }
  for (const k of Object.keys(obj)) {
    const child = obj[k];
    if (child && typeof child === "object") {
      if (isOtherSportTag(objectSportTag(child))) continue; // a different sport's block, skip it
      const found = findCareerStatsInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
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
  if (!isOtherSportTag(objectSportTag(obj)) && keys.some((k) => statKeyPattern.test(k))) {
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
      if (isOtherSportTag(objectSportTag(child))) continue; // a different sport's block, skip it
      const found = findStatsInObject(child, (depth || 0) + 1);
      if (found) return found;
    }
  }
  return null;
}

module.exports = { fetchMaxPrepsStats, fetchMaxPrepsCareerStats, fetchMaxPrepsSchedule };
